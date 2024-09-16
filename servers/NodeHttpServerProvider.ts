import { Xpresser } from "@xpresser/framework/xpresser.js";
import { HttpServerProvider, HttpServerProviderStructure, OnHttpListen } from "../provider.js";
import XpresserRouter from "../router/index.js";
import { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node Server Request Function
 */
type NodeServerReqFn = (req: IncomingMessage, res: ServerResponse) => void;

class NodeHttpServerProvider extends HttpServerProvider implements HttpServerProviderStructure {
    async init($: Xpresser) {
        // set isProduction
        this.isProduction = $.config.data.env === "production";
    }

    async boot($: Xpresser): Promise<void> {
        // import createServer as createHttpServer
        const { createServer: createHttpServer } = await import("http");
        const router = this.getRouter();

        // Preprocess routes into a map for faster lookup
        const routeMap: Map<string, NodeServerReqFn> = new Map();
        for (const route of router.routes) {
            if (typeof route.data.controller === "function") {
                routeMap.set(route.data.path as string, route.data.controller as NodeServerReqFn);
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
    }

    /**
     * Define Router Getter to have types
     */
    getRouter<Router = XpresserRouter<NodeServerReqFn>>(): Router {
        return super.getRouter() as Router;
    }
}

export default NodeHttpServerProvider;
