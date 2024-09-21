/**
 * Xpresser Request Engine
 * The purpose of this engine is to manage requests.
 * It should only carry necessary request data and methods required to handle basic CRUD operations.
 */
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http";
import { ObjectCollection } from "object-collection";
import { OutgoingHttpHeader } from "http";

/**
 * ============================================================
 * ======================== Types =============================
 * ============================================================
 */

// Primitive types that can be used in a request body
// type Primitive = string | number | boolean | null;

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
    /**
     * Request Query
     */
    query: RequestQuery;

    /**
     * Request Body
     */
    body: RequestBody;

    /**
     * Request Params
     */
    params: Record<string, string>;

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
     * Next Function (optional)
     */
    next?: () => void;

    /**
     * Respond with JSON (optional)
     * if exists, it will be used to respond to request
     * else respond method will be used
     */
    respondJson?: (data: string) => void;
}

/**
 * ============================================================
 * ======================== Defaults ==========================
 * ============================================================
 */

const defaultData: RequestEngineData = {
    query: {},
    body: {},
    params: {},
    state: {},
    respond: () => {},
    setStatusCode: () => {},
    redirect: () => {},
    setHeader: () => {},
    getHeader: () => "[getHeader] not implemented"
};

/**
 * ============================================================
 * ======================== Errors ============================
 * ============================================================
 */
const QueryIsNotAnObjectError = new Error("Query is not an object!");
const BodyIsNotAnObjectError = new Error("Body is not an object!");

export class RequestEngine {
    private data: RequestEngineData;
    private state: ObjectCollection | undefined;

    /**
     * Query Object
     * @param data
     */
    public query: RequestQuery;

    /**
     * Body Object
     * @param data
     */
    public body: RequestBody;

    constructor(data: RequestEngineData) {
        // Setup Request Engine
        this.data = { ...defaultData, ...data };

        // Set Query and Body
        this.query = this.data.query;
        this.body = this.data.body;
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
        return this.data.params[key] || defaultValue;
    }

    /**
     * Check if request has a param
     */
    hasParam(key: string): boolean {
        return key in this.data.params;
    }

    /**
     * Get Query or Default
     */
    getQuery<T = unknown>(key: string, defaultValue?: T): T {
        if (typeof this.data.query !== "object") {
            throw QueryIsNotAnObjectError;
        }

        return (this.data.query[key] || defaultValue) as T;
    }

    /**
     * Check if request has a query
     */
    hasQuery(key: string): boolean {
        if (typeof this.data.query !== "object") {
            throw QueryIsNotAnObjectError;
        }

        return key in this.data.query;
    }

    /**
     * Get Query as <T>
     */
    queryAs<T>(): T {
        return this.data.query as T;
    }

    /**
     * Get Body or Default
     */
    getBody<T = unknown>(key: string, defaultValue?: T): T {
        if (typeof this.data.body !== "object") {
            throw BodyIsNotAnObjectError;
        }

        return ((this.data.body as Record<any, any>)[key] || defaultValue) as T;
    }

    /**
     * Get Body as <T>
     */
    bodyAs<T>(): T {
        return this.data.body as T;
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
}
