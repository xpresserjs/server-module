import { Xpresser } from "@xpresser/framework/xpresser.js";
import { HttpServerProvider, HttpServerProviderStructure, OnHttpListen } from "../provider.js";
import XpresserRouter from "../router/index.js";
import { IncomingMessage, ServerResponse } from "node:http";
import RouterService from "../router/RouterService.js";

/**
 *  ReqHandlerFunction - Request Handler Function
 *  This is the type of function used in routes
 */
export type ReqHandlerFunction = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * NodeHttpServerProvider - Node Http Server Provider
 * An example of a custom http server provider for xpresser server module
 */
class NodeHttpServerProvider extends HttpServerProvider implements HttpServerProviderStructure {
    /**
     * init - Initialize Server Provider
     * @param $
     */
    async init($: Xpresser) {
        // set isProduction
        this.isProduction = $.config.data.env === "production";
    }

    /**
     * boot - Boot Server Provider
     * @param $
     */
    async boot($: Xpresser): Promise<void> {
        // import createServer as createHttpServer
        const { createServer: createHttpServer } = await import("http");

        // get router from provider
        const router = this.getRouter();
        const routerService = new RouterService(router);
        const routes = routerService.toArray();

        $.console.logInfo(`Using ${routes.length} routes.`);

        // Preprocess routes into a map for faster lookup
        const routeMap: Map<string, ReqHandlerFunction> = new Map();
        for (const route of routes) {
            if (typeof route.controller === "function") {
                routeMap.set(route.path as string, route.controller as ReqHandlerFunction);
            }
        }

        // Create server
        const server = createHttpServer((req, res) => {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const routeHandler = routeMap.get(url.pathname);

            if (routeHandler) {
                routeHandler(req, res);
            } else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found!");
            }
        });

        // get port from config or use default 80
        const port = $.config.getTyped("server.port", 80);

        // Start server
        await new Promise<void>((resolve, reject) => {
            server.listen(port, "127.0.0.1", () => {
                OnHttpListen($, port);
                resolve();
            });
            server.on("error", reject);
        });

        $.on.stop(function (next) {
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
     * Define Router Getter to have types
     */
    getRouter<Router = XpresserRouter<ReqHandlerFunction>>(): Router {
        return super.getRouter() as Router;
    }
}

export default NodeHttpServerProvider;
