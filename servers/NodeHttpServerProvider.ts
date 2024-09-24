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
import { LRUCache } from "lru-cache";

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
    static config = {
        name: "Xpresser/NodeHttpServerProvider"
    };
    /**
     * Routes
     * @private
     */
    private routes = new Map<string, RouteData>();

    /**
     * Routes Cache.
     * Cache for routes to improve performance
     */
    private routesCache: LRUCache<string, { key: string; params: Record<string, string> }>;

    /**
     * Not Found Routes Cache.
     * Cache for not found routes to improve performance
     */
    private notFoundCache: LRUCache<string, number>;

    /**
     * config - Server Configuration
     */
    public config: NodeHttpServerProviderConfig;

    private readonly useNativeRequestHandler: boolean;

    constructor($: Xpresser, config: Partial<NodeHttpServerProviderConfig> = {}) {
        super($);

        // Initialize config with default values and override with provided config
        this.config = {
            requestHandler: "xpresser",
            routesCacheSize: 100_000,
            notFoundCacheSize: 100_000,
            ...config
        };
        this.useNativeRequestHandler = this.config.requestHandler === "native";
        this.routesCache = new LRUCache({
            max: this.config.routesCacheSize,
            // cache routes for 1 hour
            ttl: 1000 * 60 * 60
        });

        this.notFoundCache = new LRUCache({
            max: this.config.notFoundCacheSize,
            // cache not found routes for 1 week
            ttl: 1000 * 60 * 60 * 24 * 7
        });
    }

    /**
     * init - Initialize Server Provider
     * @param $
     */
    async init($: Xpresser): Promise<void> {
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

        const server = createHttpServer(this.requestListener);
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
     * @param $
     * @param route
     * @param req
     * @param res
     * @private
     */
    private handleRoute(route: RouteData, req: IncomingMessage, res: ServerResponse): void {
        if (this.useNativeRequestHandler) {
            (route.controller as Function)(req, res);
        } else {
            (route.controller as Function)(
                NodeHttpServerRequestEngine.use(this.$, route, req, res)
            );
        }
    }

    /**
     * Request Listener
     * Handles incoming requests
     * @param req
     * @param res
     */
    private requestListener = (req: IncomingMessage, res: ServerResponse): void => {
        const method = req.method?.toUpperCase() ?? "GET";
        const url = req.url ?? "/";
        const pathname = url.split("?")[0];

        const routeKey = `${method} ${pathname}`;
        let route = this.routes.get(routeKey);
        let params: Record<string, string> | undefined;

        if (!route) {
            // Check cache first
            const fromCache = this.routesCache.get(pathname);
            if (fromCache) {
                route = this.routes.get(fromCache.key)!;
                params = fromCache.params;
            } else {
                // If not in cache, check if it's a known not-found route
                if (this.notFoundCache.has(routeKey)) {
                    return this.sendNotFound(res);
                }

                // If not in not-found cache, try path-to-regexp
                for (const [, value] of this.routes) {
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
            if (params) req.params = params;
            this.handleRoute(route, req, res);
        } else {
            // Add to not found cache
            this.notFoundCache.set(routeKey, 1);
            this.sendNotFound(res);
        }
    };

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
    config: Partial<NodeHttpServerProviderConfig & { defaultModule: boolean }> = {}
) {
    const { defaultModule, ...otherConfigs } = config;

    // Initialize Server
    const server = new NodeHttpServerProvider($, otherConfigs);

    // Register Server Module
    await RegisterServerModule($, server, defaultModule === true);

    // Return raw router that makes use of the default request engine
    const nativeRouter = server.getNativeRouter();

    // Return router type that makes use of the xpresser request handler
    const router = server.getRouter();

    return { server, nativeRouter, router };
}

/**
 * ==========================================================================
 * ============================= Type Declarations ==========================
 * ==========================================================================
 */

// Add `params` to `IncomingMessage` interface
declare module "http" {
    interface IncomingMessage {
        params: Record<string, string>;
    }
}
