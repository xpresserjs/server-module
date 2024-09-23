import { respond, SetupXpresser } from "./src/functions.js";
import { useNodeHttpServerProvider } from "../servers/NodeHttpServerProvider.js";

const $ = await SetupXpresser();
const { server, router, nativeRouter } = await useNodeHttpServerProvider($, {
    defaultModule: true
});

const handler = server.config.requestHandler;
$.console.logInfo(`Using [${handler}] Request Handler`);

if (server.config.requestHandler === "native") {
    nativeRouter.get("/", (_req, res) => {
        respond(res, "1");
    });
} else {
    router.get("/", (http) => {
        http.send("1");
    });
}

await $.start();
