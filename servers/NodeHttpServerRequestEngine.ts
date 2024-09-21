import { RequestEngine } from "../engines/RequestEngine.js";
import { IncomingMessage, ServerResponse } from "node:http";

export default class NodeHttpServerRequestEngine extends RequestEngine {
    public req!: IncomingMessage;
    public res!: ServerResponse;

    static async use(req: IncomingMessage, res: ServerResponse) {
        // parse query
        const url = new URL(req.url || "", "http://localhost");
        const query = Object.fromEntries(url.searchParams.entries());
        const body = await convertBodyToObject(req);

        const rq = new this({
            query: query,
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
                res.statusCode = 302;
                res.setHeader("Location", url);
            },

            setHeader: (type, key, value) => {
                if (type === "response") {
                    res.setHeader(key as string, value as string);
                } else {
                    req.headers[key as string] = value as string;
                }
            },

            getHeader: (type, key) => {
                if (type === "response") {
                    return res.getHeader(key as string) as string;
                } else {
                    return req.headers[key as string];
                }
            },

            next: () => {
                // do nothing
            }
        });

        rq.req = req;
        rq.res = res;

        return rq;
    }
}

// Send JSON Response
// function sendJson(res: ServerResponse, data: string | object, status = 200) {
//     // set status code
//     res.statusCode = status;
//     res.setHeader("Content-Type", "application/json");
//     res.write(typeof data === "string" ? data : JSON.stringify(data));
//     res.end();
// }

// Convert Body to Object
function convertBodyToObject(req: IncomingMessage): Promise<Record<string, any> | null> {
    return new Promise((resolve) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                resolve(null);
            }
        });
    });
}
