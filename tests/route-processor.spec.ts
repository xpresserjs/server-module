import { test } from "@japa/runner";
import Router from "../router/index.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { NamedFunc } from "../../xpresser-framework/functions/utils.js";

const demoHandler = (_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`The current route is: ${_req.url}`);
};

test.group("RouteProcessor", (group) => {
    let router = new Router();

    group.setup(() => {
        router.get("/", NamedFunc("Index", demoHandler));
        router.get("/about", NamedFunc("About", demoHandler));
    });

    test("Should add routes to router", ({ assert }) => {
        assert.equal(router.routes.length, 2);
    });
});
