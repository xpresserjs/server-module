import { test } from "@japa/runner";
import Router from "../router/index.js";
import { IncomingMessage, ServerResponse } from "node:http";
import RouterService from "../router/RouterService.js";
import { SetupXpresser } from "./src/functions.js";
import { RegisterServerModule } from "../index.js";
import { NamedFunc } from "../../xpresser-framework/functions/utils.js";

/**
 * Make Handler
 * @param name
 */
function makeHandler(name: string) {
    return NamedFunc(name, function (req: IncomingMessage, res: ServerResponse) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(
            JSON.stringify({
                name,
                url: req.url
            })
        );
    });
}

test.group("RouterService", (group) => {
    let router = new Router();
    const routerService = new RouterService(router);

    group.setup(async () => {
        router.get("/", makeHandler("Index"));
        router.get("/about", makeHandler("About"));

        router.path("/api", () => {
            router.get("/", makeHandler("Api Index"));
            router.get("/users", makeHandler("Api Users"));

            router.path("/user/:user", () => {
                router.get("", makeHandler("User Index"));
                router.post("", makeHandler("User Profile"));

                router.path("/posts", () => {
                    router.get("", makeHandler("User Posts"));
                    router.post("", makeHandler("User Create Post"));
                });
            });
        });

        const { $, nodeServer } = await SetupXpresser();
        await RegisterServerModule($, nodeServer);
        $.modules.setDefault("server");

        // Set Router
        nodeServer.setRouter(router);

        await $.start();
    });

    test("Should add routes to router", ({ assert }) => {
        // routes should be 3
        // not 4 because the path is one route
        // all routes defined in a path are confined in a function so they are one route
        assert.equal(router.routes.length, 3);
    });

    test("toArray()", () => {
        const json = routerService.toArray();
        console.log(json);
        // routerService.toArray();
        // assert.deepEqual(json, [
        //     { method: "GET", path: "/", controller: demoHandler },
        //     { method: "GET", path: "/about", controller: demoHandler },
        //     { method: "GET", path: "/api", controller: demoHandler },
        //     { method: "GET", path: "/api/users", controller: demoHandler }
        // ] as typeof json);
    });

    // test("toJson()", ({ assert }) => {
    //     const json = routerService.toJson();
    //     assert.equal(
    //         json,
    //         JSON.stringify([
    //             { method: "GET", path: "/" },
    //             { method: "GET", path: "/about" },
    //             {
    //                 path: "/api",
    //                 children: [
    //                     { method: "GET", path: "/" },
    //                     { method: "GET", path: "/users" }
    //                 ]
    //             }
    //         ] as Array<RouteData | RoutePathData>)
    //     );
    // }).skip();
    //
    // test("toJsonObject()", ({ assert }) => {
    //     const json = routerService.toJsonObject();
    //     assert.deepEqual(json, [
    //         { method: "GET", path: "/" },
    //         { method: "GET", path: "/about" },
    //         {
    //             path: "/api",
    //             children: [
    //                 { method: "GET", path: "/" },
    //                 { method: "GET", path: "/users" }
    //             ]
    //         }
    //     ] as typeof json);
    // }).skip();
});
