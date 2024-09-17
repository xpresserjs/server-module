import type { Xpresser } from "@xpresser/framework/xpresser.js";
import "../index.js";
import { test } from "@japa/runner";
import { RegisterServerModule } from "../index.js";
import type { ServerResponse } from "node:http";
import NodeHttpServerProvider from "../servers/NodeHttpServerProvider.js";

/**
 * Respond with text
 * @param res
 * @param text
 */
function respond(res: ServerResponse, text: string) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(text);
}

test.group("Node Server Module", async (group) => {
    let $: Xpresser;
    let nodeServer: NodeHttpServerProvider;

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
        nodeServer = new NodeHttpServerProvider();
    });

    test("Register Node Server Module", async () => {
        await RegisterServerModule($, nodeServer);
        $.modules.setDefault("server");
    });

    test("Add Routes", async () => {
        const router = nodeServer.getRouter();

        router.get("/", (_req, res) => {
            respond(res, "Hello World!");
        });

        router.get("/about", (_req, res) => {
            respond(res, "About Page");
        });
    });

    test("Start Xpresser", async () => {
        // Start Xpresser
        const routesLength = nodeServer.getRouter().routes.length;
        $.console.logInfo(`Using ${routesLength} routes.`);
        await $.start();
    });
});
