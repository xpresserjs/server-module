import { Xpresser } from "@xpresser/framework/xpresser.js";
import { HttpServerProvider, HttpServerProviderStructure, OnHttpListen } from "../provider.js";
import XpresserRouter from "../router/index.js";
import { IncomingMessage, ServerResponse, createServer as createHttpServer } from "node:http";
import RouterService from "../router/RouterService.js";

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
    requestHandler: "default" | "xpresser";
}

/**
 * NodeHttpServerProvider - Node Http Server Provider
 * An example of a custom http server provider for xpresser server module
 */
class NodeHttpServerProvider extends HttpServerProvider implements HttpServerProviderStructure {
    private routes: Map<string, ReqHandlerFunction> | null = null;

    /**
     * config - Server Configuration
     */
    public config: NodeHttpServerProviderConfig = {
        requestHandler: "default"
    };

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
        this.routes = routerService.toControllerMap<ReqHandlerFunction>();

        $.console.logInfo(`Using ${this.routes.size} routes.`);

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
     * Request Listener
     * Handles incoming requests
     * @param req
     * @param res
     */
    private async requestListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const method = req.method?.toUpperCase() ?? "GET";
        const url = req.url ?? "/";

        const routeKey = `${method} ${url}`;
        const handler = this.routes!.get(routeKey);

        if (handler) {
            handler(req, res);
        } else {
            this.sendNotFound(res);
        }
    }

    /**
     * Send a 404 response
     * @param res
     */
    private sendNotFound(res: ServerResponse): void {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(notFoundResponse);
    }

    /**
     * Define Router Getter to have types
     */
    getRouter<Router = XpresserRouter<ReqHandlerFunction>>(): Router {
        return super.getRouter() as Router;
    }
}

export default NodeHttpServerProvider;
