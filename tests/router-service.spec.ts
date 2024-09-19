import { test } from "@japa/runner";
import Router from "../router/index.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { NamedFunc } from "@xpresser/framework/functions/utils.js";
import RouterService from "../router/RouterService.js";

const demoHandler = (_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`The current route is: ${_req.url}`);
};

test.group("RouterService", (group) => {
    let router = new Router();
    const routerService = new RouterService(router);

    group.setup(() => {
        router.get("/", NamedFunc("Index", demoHandler));
        router.get("/about", NamedFunc("About", demoHandler));

        router.path("/api", () => {
            router.get("/", NamedFunc("Api Index", demoHandler));
            router.get("/users", NamedFunc("Api Users", demoHandler));

            router.path("/:user", () => {
                router.get("", NamedFunc("User Index", demoHandler));
                router.post("", NamedFunc("User Profile", demoHandler));

                router.path("/posts", () => {
                    router.get("", NamedFunc("User Posts", demoHandler));
                    router.post("", NamedFunc("User Create Post", demoHandler));
                });
            });
        });
    });

    test("Should add routes to router", ({ assert }) => {
        // routes should be 3
        // not 4 because the path is one route
        // all routes defined in a path are confined in a function so they are one route
        assert.equal(router.routes.length, 3);
    });

    test("toObject()", () => {
        // const json = routerService.toObject();
        // console.log(json);
        routerService.toObject();
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
