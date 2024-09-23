/**
 * Xpresser Request Engine
 * The purpose of this engine is to manage requests.
 * It should only carry necessary request data and methods required to handle basic CRUD operations.
 */
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http";
import { ObjectCollection } from "object-collection";
import { OutgoingHttpHeader } from "http";
import { RouteData } from "../router/RouterRoute.js";

/**
 * ============================================================
 * ======================== Types =============================
 * ============================================================
 */

// Primitive types that can be used in a request body
// Primitive types that can be used in a request body
type Primitive = string | number | boolean | null;

// A single value or a nested object containing various types
interface JsonObject {
    [key: string]: JsonValue;
}

// Array type that can hold any valid JSON values
type JsonArray = JsonValue[];

// A value in a JSON structure can be any of the following:
type JsonValue = Primitive | JsonObject | JsonArray;

// Request body can be a primitive, an object, or an array of these types.
type RequestBody =
    | string // Single string value
    | number // Single number value
    | boolean // Single boolean value
    | null // Null value
    | object // JSON object (key-value pairs)
    | RequestBody[]; // Array of any of the above types

// Query parameter can be a string, number, boolean, or an array of these types.
type RequestQuery = {
    [key: string]: string | number | boolean | (string | number | boolean)[] | undefined;
};

type SetHeaderFunction = <T extends "request" | "response">(
    type: T,
    key: T extends "request" ? keyof IncomingHttpHeaders : keyof OutgoingHttpHeaders,
    value: T extends "request"
        ? IncomingHttpHeaders[keyof IncomingHttpHeaders]
        : OutgoingHttpHeaders[keyof OutgoingHttpHeaders]
) => void;

type GetHeaderFunction = <T extends "request" | "response">(
    type: T,
    key: T extends "request" ? keyof IncomingHttpHeaders : keyof OutgoingHttpHeaders
) => T extends "request"
    ? IncomingHttpHeaders[keyof IncomingHttpHeaders]
    : OutgoingHttpHeaders[keyof OutgoingHttpHeaders];

export interface RequestEngineData {
    // /**
    //  * Request Query
    //  */
    // query: RequestQuery;
    //
    // /**
    //  * Request Body
    //  */
    // body: RequestBody;
    //
    // /**
    //  * Request Params
    //  */
    // params: Record<string, string>;

    /**
     * Request State
     */
    state: Record<string, any>;

    /**
     * Respond to request
     * @param data
     */
    respond: (data: any) => void;

    /**
     * Set Status Code
     * @param code
     */
    setStatusCode: (code: number) => void;

    /**
     * Redirect
     * @param url
     */
    redirect: (url: string) => void;

    /**
     * Set Headers
     */
    setHeader: SetHeaderFunction;

    /**
     * Get Headers
     */
    getHeader: GetHeaderFunction;

    /**
     * Parse Body - Return Parsed Body
     * This will be called once when useBody() is called
     */
    parseBody: () => RequestBody | Promise<RequestBody>;

    /**
     * Parse Query - Return Parsed Query
     */
    parseQuery: () => RequestQuery;

    /**
     * Parse Params - Return Parsed Params
     */
    parseParams: () => Record<string, string>;

    /**
     * Next Function (optional)
     */
    next?: () => void;

    /**
     * Respond with JSON (optional)
     * if exists, it will be used to respond to request
     * else respond method will be used
     */
    respondJson?: (data: JsonValue) => void;
}

/**
 * ============================================================
 * ======================== Defaults ==========================
 * ============================================================
 */

const defaultData: RequestEngineData = {
    state: {},
    respond: () => {},
    setStatusCode: () => {},
    redirect: () => {},
    setHeader: () => {},
    getHeader: () => "[getHeader] not implemented",
    parseBody: () => ({}),
    parseQuery: () => ({}),
    parseParams: () => ({})
};

/**
 * ============================================================
 * ======================== Errors ============================
 * ============================================================
 */

const QueryIsNotAnObjectError = new Error("Query is not an object!");

/**
 * ============================================================
 * ======================== Request Engine ====================
 * ============================================================
 */

export type RequestEngineRoute = Pick<RouteData, "method" | "path" | "name" | "params">;

export class RequestEngine {
    private data: RequestEngineData;
    private state: ObjectCollection | undefined;

    /**
     * Query Object
     * @param data
     */
    private query!: RequestQuery;

    /**
     * Body Object
     * @param data
     */
    private body!: RequestBody;

    /**
     * Params Object
     */
    private params!: Record<string, string>;

    /**
     * Request Object
     */
    readonly route: RequestEngineRoute;

    constructor(route: RouteData, data: RequestEngineData) {
        // Set Route
        this.route = RequestEngine.getRouteData(route);

        // Setup Request Engine
        this.data = { ...defaultData, ...data };
    }

    /**
     * Use Params
     */
    useParams<T = Record<string, any>>(): T {
        if (!this.params) {
            this.params = this.data.parseParams();
        }

        return this.params as T;
    }

    /**
     * Use Query
     */
    useQuery<T = RequestQuery>(): T {
        if (!this.query) {
            this.query = this.data.parseQuery();
        }

        return this.query as T;
    }

    /**
     * Use Body
     */
    async useBody<T extends RequestBody = Record<any, any>>(): Promise<T> {
        if (!this.body) {
            this.body = await this.data.parseBody();
        }

        return this.body as T;
    }

    /**
     * Use State;
     * To prevent memory leaks, we only set state when it is necessary.
     * So to use state, you must call this method.
     */
    useState(): ObjectCollection {
        if (!this.state) {
            this.state = new ObjectCollection(this.data.state);
        }

        return this.state;
    }

    /**
     * Get Param or Default
     */
    param(key: string, defaultValue?: string) {
        const params = this.useParams();
        return params[key] || defaultValue;
    }

    /**
     * Check if request has a param
     */
    hasParam(key: string): boolean {
        return key in this.useParams();
    }

    /**
     * Get Query or Default
     */
    getQuery<T = unknown>(key: string, defaultValue?: T): T {
        const query = this.useQuery();

        if (typeof query !== "object") {
            throw QueryIsNotAnObjectError;
        }

        return (query[key] || defaultValue) as T;
    }

    /**
     * Check if request has a query
     */
    hasQuery(key: string): boolean {
        const query = this.useQuery();

        if (typeof query !== "object") {
            throw QueryIsNotAnObjectError;
        }

        return key in query;
    }

    /**
     * Redirect
     */
    redirect(url: string) {
        return this.data.redirect(url);
    }

    /**
     * Redirect Back
     */
    redirectBack() {
        const referer = this.data.getHeader("request", "referer") || "/";
        return this.data.redirect(referer as string);
    }

    /**
     * Set Status Code
     */
    status(code: number) {
        this.data.setStatusCode(code);
        return this;
    }

    /**
     * Respond
     */
    send<Body>(data: Body) {
        this.data.respond(data);
    }

    /**
     * Respond with JSON
     */
    json(data: JsonValue) {
        if (this.data.respondJson) {
            return this.data.respondJson(data);
        }

        this.data.setHeader("response", "Content-Type", "application/json");
        this.data.respond(JSON.stringify(data));
    }

    /**
     * Set header
     */
    setHeader(key: keyof OutgoingHttpHeaders, value: OutgoingHttpHeader) {
        this.setResponseHeader(key, value);
        return this;
    }

    /**
     * Get header
     */
    getHeader(key: keyof IncomingHttpHeaders) {
        return this.getRequestHeader(key);
    }

    /**
     * Get Response Header
     */
    getResponseHeader(key: keyof OutgoingHttpHeaders) {
        return this.data.getHeader("response", key);
    }

    /**
     * Set Response Header
     */
    setResponseHeader(key: keyof OutgoingHttpHeaders, value: OutgoingHttpHeader) {
        this.data.setHeader("response", key, value);
        return this;
    }

    /**
     * Get Request Header
     */
    getRequestHeader(key: keyof IncomingHttpHeaders) {
        return this.data.getHeader("request", key);
    }

    /**
     * Set Request Header
     */
    setRequestHeader(
        key: keyof IncomingHttpHeaders,
        value: IncomingHttpHeaders[keyof IncomingHttpHeaders]
    ) {
        this.data.setHeader("request", key, value);
        return this;
    }

    /**
     * Get Route Data
     * @param route
     */
    static getRouteData(route: RouteData): RequestEngineRoute {
        return {
            method: route.method,
            name: route.name,
            params: route.params,
            path: route.path
        };
    }
}
