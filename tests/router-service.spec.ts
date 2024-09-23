import { test } from "@japa/runner";
import { SetupXpresser, TearDownXpresser } from "./src/functions.js";
import { NamedFunc } from "@xpresser/framework/functions/utils.js";
import { useNodeHttpServerProvider } from "../servers/NodeHttpServerProvider.js";
import RouterService from "../router/RouterService.js";
import type Router from "../router/index.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { RouteData } from "../router/RouterRoute.js";
import type { Xpresser } from "@xpresser/framework";

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
    let $: Xpresser;
    let router: Router;
    let routerService: RouterService;

    group.setup(async () => {
        $ = await SetupXpresser();
        const { nativeRouter } = await useNodeHttpServerProvider($, { defaultModule: true });

        // set globals
        router = nativeRouter;
        routerService = RouterService.use(router);

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

        await $.start();
    });

    group.teardown(() => TearDownXpresser($));

    test("Should add routes to router", ({ assert }) => {
        // routes should be 3
        // not 4 because the path is one route
        // all routes defined in a path are confined in a function so they are one route
        assert.equal(router.routes.length, 3);
    });

    const expectedRoutes: RouteData[] = [
        { method: "GET", path: "/", controller: handlers.index },
        { method: "GET", path: "/about", controller: handlers.about },
        { method: "GET", path: "/api", controller: handlers.api_index },
        { method: "GET", path: "/api/users", controller: handlers.api_users },
        { method: "GET", path: "/api/user/:user", controller: handlers.api_user_index },
        { method: "POST", path: "/api/user/:user", controller: handlers.api_user_profile },
        {
            method: "GET",
            path: "/api/user/:user/posts",
            controller: handlers.api_user_posts_index
        },
        {
            method: "POST",
            path: "/api/user/:user/posts",
            controller: handlers.api_user_posts_create
        }
    ];

    test("toArray()", ({ assert }) => {
        const all = routerService.toArray();
        for (const route of all) {
            if (typeof route.path === "string") {
                assert.properties(route, ["method", "path", "controller", "pathToRegexpFn"]);
            } else {
                assert.properties(route, ["method", "path", "controller"]);
            }
        }
    });

    test("toJson()", ({ assert }) => {
        const json = routerService.toJson();
        assert.equal(json, JSON.stringify(expectedRoutes));
    });

    test("toJsonObject()", ({ assert }) => {
        const obj = routerService.toJsonObject();
        const expected = JSON.parse(JSON.stringify(expectedRoutes));

        assert.deepEqual(obj, expected);
    });
});
