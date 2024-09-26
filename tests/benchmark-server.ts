import { respond, SetupXpresser } from "./src/functions.js";
import NodeHttpServerProvider from "../servers/NodeHttpServerProvider.js";

const $ = await SetupXpresser();
const { server, router, nativeRouter } = await NodeHttpServerProvider.use($, {
    defaultModule: true
});

const handler = server.config.requestHandler;
$.console.logInfo(`Using [${handler.toUpperCase()}] Request Handler`);

if (server.useNativeRequestHandler) {
    nativeRouter.get("/", (_req, res) => {
        respond(res, "1");
    });
} else {
    router.get("/", (http) => {
        http.send("1");
    });
}

await $.start();
