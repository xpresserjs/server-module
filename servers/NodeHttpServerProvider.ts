import { Xpresser } from "@xpresser/framework/index.js";
import { HttpServerProvider, HttpServerProviderStructure, OnHttpListen } from "../provider.js";
import XpresserRouter from "../router/index.js";
import { IncomingMessage, ServerResponse, createServer as createHttpServer } from "node:http";
import RouterService from "../router/RouterService.js";
import NodeHttpServerRequestEngine, {
    RouterReqHandlerFunction
} from "./NodeHttpServerRequestEngine.js";
import { RegisterServerModule } from "../index.js";
import { RouteData } from "../router/RouterRoute.js";
import { LRUMap } from "mnemonist";

// Pre-defined 404 response to avoid constructing the same response on every request
const notFoundResponse = Buffer.from("Not Found!");

/**
 *  ReqHandlerFunction - Request Handler Function
 *  This is the type of function used in routes
 */
export type ReqHandlerFunction = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Provider Configuration
 */
export interface NodeHttpServerProviderConfig {
    /**
     * Request Handler
     * - `native` uses the native request handler
     * - `xpresser` uses the xpresser request handler
     *
     * @default "xpresser"
     * @example
     * // If requestHandler is set to `native`
     * router.get("/", (req, res) => {
     *     res.end(`Your url is ${req.url}`);
     * })
     *
     * // If requestHandler is set to `xpresser`
     * router.get("/", (http) => {
     *     http.send(`Your url is ${http.req.url}`);
     * })
     */
    requestHandler: "native" | "xpresser";

    /**
     * Routes Cache Size
     * Number of routes to cache to improve performance.
     * `LRUMap` is used to cache routes
     */
    routesCacheSize: number;

    /**
     * Not Found Cache Size
     * Number of not found routes to cache to improve performance.
     * `LRUMap` is used to cache not found routes
     */
    notFoundCacheSize: number;
}

/**
 * NodeHttpServerProvider - Node Http Server Provider
 * An example of a custom http server provider for xpresser server module
 */
class NodeHttpServerProvider extends HttpServerProvider implements HttpServerProviderStructure {
    /**
     * Routes
     * @private
     */
    private routes = new Map<string, RouteData>();

    /**
     * Routes Cache.
     * Cache for routes to improve performance
     */
    private routesCache: LRUMap<string, { key: string; params: Record<string, string> } | null>;

    /**
     * Not Found Routes Cache.
     * Cache for not found routes to improve performance
     */
    private notFoundCache: LRUMap<string, number>;

    /**
     * config - Server Configuration
     */
    public config: NodeHttpServerProviderConfig = {
        requestHandler: "xpresser",
        routesCacheSize: 100_000,
        notFoundCacheSize: 100_000
    };

    private readonly useNativeRequestHandler;

    constructor(config: Partial<NodeHttpServerProviderConfig> = {}) {
        super();
        this.config = { ...this.config, ...config };
        this.useNativeRequestHandler = this.config.requestHandler === "native";
        this.routesCache = new LRUMap(this.config.routesCacheSize);
        this.notFoundCache = new LRUMap(this.config.notFoundCacheSize);
    }

    /**
     * init - Initialize Server Provider
     * @param $
     */
    async init($: Xpresser) {
        this.isProduction = $.config.data.env === "production";
    }

    /**
     * boot - Boot Server Provider
     * @param $
     */
    async boot($: Xpresser): Promise<void> {
        const router = this.getRouter();
        const routerService = RouterService.use(router);

        this.routes = routerService.toMap();

        const server = createHttpServer(this.requestListener.bind(this));

        const port = $.config.getTyped("server.port", 80);

        await new Promise<void>((resolve, reject) => {
            server.listen(port, "127.0.0.1", () => {
                OnHttpListen($, port);
                resolve();
            });

            server.on("error", (err) => {
                $.console.logError(`Server Error: ${err.message}`);
                reject(err);
            });
        });

        $.on.stop((next) => {
            server.close((err) => {
                if (err) {
                    $.console.logError("Error closing server");
                    $.console.logError(err);
                } else {
                    $.console.logSuccess("Server closed successfully");
                }
                next();
            });
        });
    }

    /**
     * handleRoute - Handle Route
     * If `useNativeRequestHandler` is true, it calls the controller with `req` and `res`
     * else it calls the controller with an instance of `NodeHttpServerRequestEngine`
     * @param route
     * @param req
     * @param res
     * @private
     */
    private handleRoute(route: RouteData, req: IncomingMessage, res: ServerResponse) {
        if (this.useNativeRequestHandler) {
            (route.controller as Function)(req, res);
        } else {
            (route.controller as Function)(NodeHttpServerRequestEngine.use(route, req, res));
        }
    }

    /**
     * Request Listener
     * Handles incoming requests
     * @param req
     * @param res
     */
    private async requestListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const method = req.method?.toUpperCase() ?? "GET";
        const url = req.url ?? "/";
        const pathname = url.split("?")[0];

        const routeKey = `${method} ${pathname}`;
        let route = this.routes!.get(routeKey);

        if (!route) {
            const fromCache = this.routesCache.get(pathname);
            if (fromCache) {
                route = this.routes!.get(fromCache.key)!;
            } else {
                // before we try finding route in cache, check if it is in not found cache
                if (this.notFoundCache.has(routeKey)) {
                    return this.sendNotFound(res);
                }

                // try path-to-regexp
                for (const [, value] of this.routes!.entries()) {
                    if (!value.pathToRegexpFn || !value.pathToRegexp) continue;

                    // check if route matches
                    const regexpMatch = value.pathToRegexpFn(pathname);
                    if (!regexpMatch) continue;

                    this.routesCache.set(pathname, {
                        key: `${method} ${value.path}`,
                        params: regexpMatch.params
                    });

                    route = value;
                    break;
                }
            }
        }

        if (route) {
            this.handleRoute(route, req, res);
        } else {
            // Add to not found cache
            this.notFoundCache.set(routeKey, 1);

            this.sendNotFound(res);
        }
    }

    /**
     * Send a 404 response
     * @param res
     */
    protected sendNotFound(res: ServerResponse): void {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(notFoundResponse);
    }

    /**
     * Get Router - Returns Xpresser Router
     * @example
     * const router = server.getRouter();
     *
     * router.get("/", (http) => {
     *     // `http` is an instance of Xpresser Request Engine
     *     http.send("Hello World!");
     * })
     */
    getRouter<Router = RouterReqHandlerFunction>(): Router {
        return super.getRouter() as Router;
    }

    /**
     * Get Native Router - same as `getRouter` but returns as a typed version of `http.IncomingMessage`
     * @example
     * const router = server.getNativeRouter();
     *
     * router.get("/", (req, res) => {
     *    // `req` is an instance of `http.IncomingMessage`
     *    // `res` is an instance of `http.ServerResponse`
     *    res.end("Hello World!");
     * })
     */
    getNativeRouter<Router = XpresserRouter<ReqHandlerFunction>>(): Router {
        return super.getRouter() as Router;
    }
}

export default NodeHttpServerProvider;

/**
 * useNodeHttpServerProvider - Use Node Http Server Provider
 * @param $
 * @param config
 * @example
 * const { router } = await useNodeHttpServerProvider($);
 *
 * router.get("/", (http) => {
 *     http.json({ message: "Hello World!!" });
 * });
 */
export async function useNodeHttpServerProvider(
    $: Xpresser,
    config: Partial<NodeHttpServerProviderConfig & { defaultModule: true }> = {}
) {
    const { defaultModule, ...otherConfigs } = config;

    // Initialize Server
    const server = new NodeHttpServerProvider(otherConfigs);

    // Register Server Module
    await RegisterServerModule($, server, defaultModule === true);

    // Return raw router that makes use of the default request engine
    const nativeRouter = server.getNativeRouter();

    // Return router type that makes use of the xpresser request handler
    const router = server.getRouter();

    return { server, nativeRouter, router };
}
