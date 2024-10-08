import type { StringOrRegExp, Routes } from "./types.js";

export interface RoutePathData {
    method?: string;
    path: StringOrRegExp;
    controller?: string;
    middleware?: string | string[];
    as?: string;
    children?: Routes;
    useActionsAsName?: boolean;
}

class RouterPath {
    public data: RoutePathData;
    public namespace: string = "";

    /**
     * Constructor
     * @param {string} method
     * @param {StringOrRegExp} path
     * @param {string} routes
     * @param {string} [namespace]
     */
    constructor(path: StringOrRegExp, routes: Routes, namespace: string = "") {
        this.data = { path };

        if (routes) {
            this.data.children = routes;
        } else {
            this.data.children = [];
        }

        this.namespace = namespace;

        return this;
    }

    /**
     * Set group prefix name of this route.
     * @param {string} as
     * @returns {RouterPath}
     */
    as(as: string): this {
        this.data["as"] = as;
        return this;
    }

    /**
     * Set Controller of this route
     * @param {string} controller
     * @param {boolean} [actionsAsName=false]
     * @returns {RouterPath}
     */
    controller(controller: string, actionsAsName: boolean = false): this {
        if (this.namespace.length) {
            this.data["controller"] = this.namespace + "::" + controller;
        } else {
            this.data["controller"] = controller;
        }

        if (actionsAsName) {
            return this.actionsAsName();
        }

        return this;
    }

    /**
     * Add middleware for all routes in path
     * @param {string} middleware
     */
    middleware(middleware: string | string[]): this {
        this.data["middleware"] = middleware;
        return this;
    }

    /**
     * Add middlewares to all routes
     * @param middlewares
     */
    middlewares(middlewares: string[]): this {
        return this.middleware(middlewares);
    }

    /**
     * Sets names of every route in group as their method name
     * @returns {RouterPath}
     */
    actionsAsName(): this {
        this.data["useActionsAsName"] = true;
        return this;
    }

    /**
     * To JSON
     */
    toJSON() {
        return this.data;
    }
}

export default RouterPath;
