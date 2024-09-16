import type { Xpresser } from "@xpresser/framework/xpresser.js";
import { HttpServerProvider, HttpServerProviderStructure, OnHttpListen } from "../provider.js";
import "../index.js";
import { test } from "@japa/runner";
import { RegisterServerModule } from "../index.js";
import XpresserRouter from "../router/index.js";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Node Server Request Function
 */
type NodeServerReqFn = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Respond with text
 * @param res
 * @param text
 */
function respond(res: ServerResponse, text: string) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(text);
}

/**
 * Add BootCycle types
 */
// declare module "@xpresser/framework/engines/BootCycleEngine.js" {
//     module BootCycle {
//         enum Cycles {
//             nodeServerInit = "nodeServerInit",
//         }
//     }
// }

class NodeServer extends HttpServerProvider implements HttpServerProviderStructure {
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

test.group("Node Server Module", async (group) => {
    let $: Xpresser;
    let nodeServer: NodeServer;

    group.setup(async () => {
        const { init, __dirname } = await import("@xpresser/framework");

        // Get Base Folder Path
        const base = __dirname(import.meta.url);

        // Init Xpresser
        $ = await init({
            env: "development",
            name: "Node Server",
            debug: {
                enabled: false,
                bootCycle: { started: true, completed: true },
                bootCycleFunction: { started: true, completed: true }
            },
            paths: { base },
            log: { asciiArt: false }
        });

        // Register Node Server Module with Xpresser
        nodeServer = new NodeServer();
    });

    test("Register Node Server Module", async ({ assert }) => {
        await RegisterServerModule($, nodeServer);
        $.modules.setDefault("server");
    });

    test("Add Routes", async ({ assert }) => {
        const router = nodeServer.getRouter();

        router.get("/", (_req, res) => {
            respond(res, "Hello World!!");
        });

        router.get("/about", (_req, res) => {
            respond(res, "About Page");
        });
    });

    test("Start Xpresser", async ({ assert }) => {
        // Start Xpresser
        const routesLength = nodeServer.getRouter().routes.length;
        $.console.logInfo(`Using ${routesLength} routes.`);
        await $.start();
    });
});
