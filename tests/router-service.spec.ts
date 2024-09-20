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

const handlers = {
    index: makeHandler("Index"),
    about: makeHandler("About"),
    api_index: makeHandler("Api Index"),
    api_users: makeHandler("Api Users"),
    api_user_index: makeHandler("User Index"),
    api_user_profile: makeHandler("User Profile"),
    api_user_posts_index: makeHandler("User Posts"),
    api_user_posts_create: makeHandler("User Create Post")
};

test.group("RouterService", (group) => {
    let router = new Router();
    const routerService = new RouterService(router);

    group.setup(async () => {
        router.get("/", handlers.index);
        router.get("/about", handlers.about);

        router.path("/api", () => {
            router.get("/", handlers.api_index);
            router.get("/users", handlers.api_users);

            router.path("/user/:user", () => {
                router.get("", handlers.api_user_index);
                router.post("", handlers.api_user_profile);

                router.path("/posts", () => {
                    router.get("", handlers.api_user_posts_index);
                    router.post("", handlers.api_user_posts_create);
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
