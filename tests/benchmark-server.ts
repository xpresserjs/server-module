import { respond, SetupXpresser } from "./src/functions.js";
import { RegisterServerModuleAsDefault } from "../index.js";
import { RouterReqHandlerFunction } from "../servers/NodeHttpServerRequestEngine.js";

const { $, nodeServer } = await SetupXpresser({
    requestHandler: "xpresser"
});

// Register Server Module
await RegisterServerModuleAsDefault($, nodeServer);
const handler = nodeServer.config.requestHandler;

$.console.logInfo(`Using [${handler}] Request Handler`);

if (nodeServer.config.requestHandler === "xpresser") {
    const router = nodeServer.getRouter<RouterReqHandlerFunction>();

    router.get("/", (http) => {
        http.send("1");
    });
} else {
    const router = nodeServer.getRouter();

    router.get("/", (_req, res) => {
        respond(res, "2");
    });
}

await $.start();
