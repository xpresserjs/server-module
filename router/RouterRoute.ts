import type { RouteHandlerFunction, StringOrRegExp } from "./types.js";
import { match, MatchFunction, pathToRegexp } from "path-to-regexp";

export interface RouteData {
    method: string;
    path: StringOrRegExp;
    controller?: RouteHandlerFunction<Function>;
    controllerIsAsync?: boolean;
    name?: string;
    params?: string[];
    pathToRegexp?: RegExp;
    pathToRegexpFn?: MatchFunction<any>;
}

class RouterRoute {
    public data: RouteData;
    public namespace: string = "";

    /**
     * Constructor
     * @param {string} method
     * @param {string} path
     * @param {string} controller
     * @param {string} [namespace]
     */
    constructor(method: string, path: StringOrRegExp, controller: any, namespace: string = "") {
        this.data = {
            method,
            path,
            controller,
            controllerIsAsync: false
        };

        if (typeof path === "string") {
            // get params using path-to-regexp
            const { keys, regexp } = pathToRegexp(path);
            const params: string[] = [];

            for (const r of keys) {
                if (r.type !== "param") continue;
                params.push(r.name);
            }

            this.data.params = params;
            this.data.pathToRegexp = regexp;
            this.data.pathToRegexpFn = match(path);
        }

        if (typeof controller === "object") {
            // set name
            this.data.controller = controller.name;

            if (controller.constructor.name === "AsyncFunction") {
                this.data.controllerIsAsync = true;
            }
        }

        this.namespace = namespace;
    }

    /**
     * Set name this of route.
     * @param {string} name
     * @returns {RouterRoute}
     */
    name(name: string): this {
        this.data["name"] = name;
        return this;
    }

    /**
     * Set Controller of this route
     * @param {string} controller
     * @returns {RouterRoute}
     */
    controller(controller: string): this {
        if (this.namespace.length) {
            this.data["controller"] = this.namespace + "::" + controller;
        } else {
            this.data["controller"] = controller;
        }
        return this;
    }

    /**
     * Set name of this route using method name
     * @returns {RouterRoute}
     */
    actionAsName(): this {
        const controller = this.data.controller;

        if (!controller) throw new Error("Method: " + controller + " not found!");
        if (typeof controller !== "string") return this;

        let name;
        if (controller.indexOf("@") >= 0) {
            name = controller.split("@")[1];
        } else {
            name = controller;
        }

        this.name(name);

        return this;
    }

    /**
     * To JSON
     */
    toJSON() {
        return this.data;
    }
}

export default RouterRoute;
