import type { Xpresser } from "@xpresser/framework/xpresser.js";
import "../index.js";
import { test } from "@japa/runner";
import { RegisterServerModule } from "../index.js";
import { ServerResponse } from "node:http";
import NodeHttpServerProvider from "../servers/NodeHttpServerProvider.js";
import { SetupXpresser } from "./src/functions.js";
import { ReqHandlerFunction } from "../servers/NodeHttpServerRequestEngine.js";
import XpresserRouter from "../router/index.js";

/**
 * Respond with text
 * @param res
 * @param text
 */
function respond(res: ServerResponse, text: string) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(text);
}

test.group("Node Server Module", (group) => {
    let $: Xpresser;
    let nodeServer: NodeHttpServerProvider;

    group.setup(async () => {
        const setup = await SetupXpresser();
        $ = setup.$;
        nodeServer = setup.nodeServer;
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
        $.onNext("serverBooted", function LogRouteInfo() {
            const routesLength = nodeServer.getRouter().routes.length;
            $.console.logInfo(`Using ${routesLength} routes.`);
        });

        await $.start();
    });

    group.teardown(async () => {
        await $.stop();
    });
});

test.group("Node Server Module With Xpresser Engine", (group) => {
    let $: Xpresser;
    let nodeServer: NodeHttpServerProvider;

    group.setup(async () => {
        const setup = await SetupXpresser({
            requestHandler: "xpresser"
        });

        $ = setup.$;
        nodeServer = setup.nodeServer;
    });

    test("Register Node Server Module", async () => {
        await RegisterServerModule($, nodeServer);
        $.modules.setDefault("server");
    });

    test("Add Routes", async () => {
        const router = nodeServer.getRouter<XpresserRouter<ReqHandlerFunction>>();

        router.get("/", (http) => {
            http.send("Hello World!");
            console.log(http.query);
        });

        router.get("/about", (http) => {
            http.send("About Page");
        });
    });

    test("Start Xpresser", async () => {
        // Start Xpresser
        $.onNext("serverBooted", function LogRouteInfo() {
            const routesLength = nodeServer.getRouter().routes.length;
            $.console.logInfo(`Using ${routesLength} routes.`);
        });

        await $.start();
    });
});
