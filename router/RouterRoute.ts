import type { RouteData, StringOrRegExp } from "./types.js";

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
            controller: <string>controller
        };

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
}

export default RouterRoute;
