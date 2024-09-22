import type { Xpresser } from "@xpresser/framework/xpresser.js";
import "../index.js";
import { test } from "@japa/runner";
import { RegisterServerModule } from "../index.js";
import NodeHttpServerProvider from "../servers/NodeHttpServerProvider.js";
import { respond, SetupXpresser } from "./src/functions.js";
import { RouterReqHandlerFunction } from "../servers/NodeHttpServerRequestEngine.js";

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
        const router = nodeServer.getRouter<RouterReqHandlerFunction>();

        router.get("/", (http) => {
            http.send("Hello World!");
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
