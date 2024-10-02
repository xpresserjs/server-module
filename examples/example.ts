import { __dirname, init } from "@xpresser/framework/index.js";
import NodeHttpServerProvider from "../servers/NodeHttpServerProvider.js";

const $ = await init({
    name: "example.ts",
    env: "development",
    paths: { base: __dirname(import.meta.url) }
});

const { router } = await NodeHttpServerProvider.use($);

router.get("/", () => "Hello World!!");

router.get("/user/:user", (http) => {
    http.json({
        message: "Hello World!!",
        params: http.useParams()
    });
});

router.post("/", async (http) => {
    const body = await http.useBody();
    http.json(body);
});

await $.start();
