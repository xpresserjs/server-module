import { RequestEngine } from "../engines/RequestEngine.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { parse as parseUrl } from "url";

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
     * @private
     * @static
     * @property {Map<string, Object>} urlCache - Cache for parsed URLs to improve performance
     */
    private static urlCache = new Map<
        string,
        { pathname: string; query: Record<string, string> }
    >();

    /**
     * @description Creates and initializes a new NodeHttpServerRequestEngine instance for the given request/response pair.
     * @param {IncomingMessage} req - The Node.js request object
     * @param {ServerResponse} res - The Node.js response object
     * @returns {Promise<NodeHttpServerRequestEngine>} A promise that resolves to the initialized engine instance
     */
    static async use(req: IncomingMessage, res: ServerResponse) {
        const { query, body } = await this.parseRequest(req);

        const rq = new this({
            query,
            body,
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

            getHeader: (type, key) =>
                (type === "response"
                    ? res.getHeader(key as string)
                    : req.headers[key as string]) as string,

            next: () => {}
        });

        rq.req = req;
        rq.res = res;

        return rq;
    }

    /**
     * @private
     * @static
     * @async
     * @function parseRequest
     * @description Parses the request URL and body concurrently for improved performance.
     * @param {IncomingMessage} req - The Node.js request object
     * @returns {Promise<Object>} A promise that resolves to an object containing parsed query and body
     */
    private static async parseRequest(
        req: IncomingMessage
    ): Promise<{ query: Record<string, string>; body: Record<string, any> | null }> {
        const [query, body] = await Promise.all([
            this.parseUrl(req.url || ""),
            this.parseBody(req)
        ]);

        return { query, body };
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
        let cached = this.urlCache.get(url);
        if (!cached) {
            const parsed = parseUrl(url, true);
            cached = {
                pathname: parsed.pathname || "",
                query: parsed.query as Record<string, string>
            };
            this.urlCache.set(url, cached);

            // clear cache after 100,000 entries
            if (this.urlCache.size > 100000) {
                this.urlCache.clear();
            }
        }
        return { ...cached.query };
    }

    /**
     * @private
     * @static
     * @function parseBody
     * @description Parses the request body if the content type is 'application/json'.
     * @param {IncomingMessage} req - The Node.js request object
     * @returns {Promise<Record<string, any> | null>} A promise that resolves to the parsed body or null
     */
    private static parseBody(req: IncomingMessage): Promise<Record<string, any> | null> {
        if (req.headers["content-type"] !== "application/json") {
            return Promise.resolve(null);
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
                    resolve(null);
                }
            });
        });
    }
}

/**
 * Handler Function Type
 */

export type ReqHandlerFunction = (http: NodeHttpServerRequestEngine) => void;
