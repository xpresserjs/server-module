import type { Xpresser } from "@xpresser/framework/xpresser.js";
import "../index.js";
import { test } from "@japa/runner";
import NodeHttpServerProvider, {
    useNodeHttpServerProvider
} from "../servers/NodeHttpServerProvider.js";
import { respond, SetupXpresser, TearDownXpresser } from "./src/functions.js";
import { RouterReqHandlerFunction } from "../servers/NodeHttpServerRequestEngine.js";

test.group("Node Server Module", (group) => {
    let $: Xpresser;
    let nodeServer: NodeHttpServerProvider;

    group.setup(async () => {
        $ = await SetupXpresser();

        const http = await useNodeHttpServerProvider($, {
            defaultModule: true
        });

        nodeServer = http.server;
    });

    group.teardown(() => TearDownXpresser($));

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
});

test.group("Node Server Module With Xpresser Engine", (group) => {
    let $: Xpresser;
    let nodeServer: NodeHttpServerProvider;
    let router: RouterReqHandlerFunction;

    group.setup(async () => {
        $ = await SetupXpresser();
        const http = await useNodeHttpServerProvider($, {
            defaultModule: true
        });

        nodeServer = http.server;
        router = http.router;
    });

    group.teardown(() => TearDownXpresser($));

    test("Add Routes", async () => {
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
