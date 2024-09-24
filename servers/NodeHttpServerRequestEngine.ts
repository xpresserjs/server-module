import { RequestEngine } from "../engines/RequestEngine.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { parse as parseUrl } from "url";
import XpresserRouter from "../router/index.js";
import { RouteData } from "../router/RouterRoute.js";
import { Xpresser } from "@xpresser/framework";

/**
 * @class NodeHttpServerRequestEngine
 * @extends RequestEngine
 * @description A high-performance request engine for Node.js HTTP servers.
 * This class optimizes request handling for Node.js environments, providing
 * efficient parsing of URLs and request bodies, and a streamlined interface
 * for request/response operations.
 *
 * @example
 * import http from 'http';
 * import NodeHttpServerRequestEngine from './NodeHttpServerRequestEngine';
 *
 * const server = http.createServer(async (req, res) => {
 *   const engine = await NodeHttpServerRequestEngine.use(req, res);
 *   // Use engine to handle the request
 * });
 *
 * server.listen(3000);
 */
export default class NodeHttpServerRequestEngine extends RequestEngine {
    /** @property {IncomingMessage} req - The Node.js request object */
    public req!: IncomingMessage;

    /** @property {ServerResponse} res - The Node.js response object */
    public res!: ServerResponse;

    /**
     * @description Creates and initializes a new NodeHttpServerRequestEngine instance for the given request/response pair.
     * @param $
     * @param {IncomingMessage} req - The Node.js request object
     * @param {ServerResponse} res - The Node.js response object
     * @param route
     */
    static use<T extends typeof NodeHttpServerRequestEngine>(
        this: T,
        $: Xpresser,
        route: RouteData,
        req: IncomingMessage,
        res: ServerResponse
    ) {
        const rq = new this(route, {
            xpresser: () => $,
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

            getHeader: (type, key) =>
                (type === "response"
                    ? res.getHeader(key as string)
                    : req.headers[key as string]) as string,

            parseParams: () => req.params,
            parseQuery: () => this.parseUrl(req.url || ""),
            parseBody: () => this.parseBody(req)
        });

        rq.req = req;
        rq.res = res;

        return rq as InstanceType<T>;
    }

    /**
     * @private
     * @static
     * @function parseUrl
     * @description Parses the URL, utilizing a cache for improved performance on repeated requests.
     * @param {string} url - The URL to parse
     * @returns {Record<string, string>} The parsed query parameters
     */
    private static parseUrl(url: string): Record<string, string> {
        const parsed = parseUrl(url, true);

        return { ...parsed.query } as Record<string, string>;
    }

    /**
     * @private
     * @static
     * @function parseBody
     * @description Parses the request body if the content type is 'application/json'.
     * @param {IncomingMessage} req - The Node.js request object
     * @returns {Promise<Record<string, any> | null>} A promise that resolves to the parsed body or null
     */
    private static parseBody(req: IncomingMessage): Promise<Record<string, any>> {
        if (req.headers["content-type"] !== "application/json") {
            return Promise.resolve({});
        }

        return new Promise((resolve) => {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve({});
                }
            });
        });
    }
}

/**
 * Handler Function Type
 */

export type ReqHandlerFunction = (http: NodeHttpServerRequestEngine) => void;
export type RouterReqHandlerFunction = XpresserRouter<ReqHandlerFunction>;
