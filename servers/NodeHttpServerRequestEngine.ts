import { RequestEngine } from "../engines/RequestEngine.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "url";

export default class NodeHttpServerRequestEngine extends RequestEngine {
    public req!: IncomingMessage;
    public res!: ServerResponse;

    static async use(req: IncomingMessage, res: ServerResponse) {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        const query = Object.fromEntries(url.searchParams);
        const body = await this.convertBodyToObject(req);

        const rq = new this({
            query,
            body: body || {},
            params: {},
            state: {},

            respond: (data) => {
                res.setHeader("Content-Type", "text/plain");
                res.end(data);
            },

            setStatusCode: (code) => {
                res.statusCode = code;
            },

            redirect: (url) => {
                res.writeHead(302, { Location: url });
                res.end();
            },

            setHeader: (type, key, value) => {
                if (type === "response") {
                    res.setHeader(key as string, value as string);
                } else {
                    req.headers[key as string] = value as string;
                }
            },

            getHeader: (type, key) => {
                return type === "response"
                    ? (res.getHeader(key as string) as string)
                    : req.headers[key as string];
            },

            next: () => {
                // do nothing
            }
        });

        rq.req = req;
        rq.res = res;

        return rq;
    }

    private static convertBodyToObject(req: IncomingMessage): Promise<Record<string, any> | null> {
        return new Promise((resolve) => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });
            req.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve(null);
                }
            });
        });
    }
}
