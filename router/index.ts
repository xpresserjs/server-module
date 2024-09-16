import { clone, kebabCase, merge, snakeCase } from "lodash";
import RouterRoute from "./src/RouterRoute.js";
import RouterPath from "./src/RouterPath.js";

import type { ManyRoutes, RouteArray, StringOrFunction, StringOrRegExp } from "./src/types.js";

class XpresserRouter {
    public namespace: string = "";
    public routes: (RouterRoute | RouterPath)[] = [];
    private readonly xpresserInstanceGetter: (() => any) | undefined;
    public readonly config = { pathCase: "snake" } as { pathCase: "snake" | "kebab" };

    constructor(namespace?: string, xpresserInstanceGetter?: () => any) {
        if (namespace !== undefined) {
            this.namespace = namespace;
        }

        if (xpresserInstanceGetter) {
            this.xpresserInstanceGetter = xpresserInstanceGetter;

            // Merge config with xpresser instance src config
            const $ = this.xpresserInstanceGetter();
            this.config = merge(this.config, $.config.get("server.router", {}));
        }
    }

    /**
     * Set path or grouped routes
     * @param {string} path
     * @param {function} routes
     * @returns {RouterPath}
     */
    public path(path: StringOrRegExp, routes?: (router: this) => void): RouterPath {
        let thisRoutes = undefined;

        if (typeof routes === "function") {
            let oldRoutes = clone(this.routes);

            this.routes = [];

            routes(this);

            thisRoutes = clone(this.routes);

            this.routes = oldRoutes;
        }

        const eachRoute = new RouterPath("children", path, thisRoutes, this.namespace);
        this.routes.push(eachRoute);

        return eachRoute;
    }

    /**
     * XpresserRouter All
     * @param {string} path
     * @param {string} [action]
     * @returns {RouterRoute}
     */
    public all(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("all", path, action);
    }

    /**
     * XpresserRouter Any
     * @param {string} path
     * @param {string} [action]
     * @returns {RouterRoute}
     */
    public any(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("all", path, action);
    }

    /**
     * XpresserRouter Delete
     * @param {string} path
     * @param {string} [action]
     * @returns {RouterRoute}
     */
    public delete(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("delete", path, action);
    }

    /**
     * Delete Many Routes
     * @param {ManyRoutes} routes
     */
    public deleteMany(routes: ManyRoutes): void {
        this.addManyRoutes("delete", routes);
    }

    /**
     * XpresserRouter Get
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public get(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("get", path, action);
    }

    /**
     * Get Many Routes
     * @param {ManyRoutes} routes
     */
    public getMany(routes: ManyRoutes): void {
        this.addManyRoutes("get", routes);
    }

    /**
     * XpresserRouter Checkout
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public checkout(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("checkout", path, action);
    }

    /**
     * XpresserRouter Copy
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public copy(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("copy", path, action);
    }

    /**
     * XpresserRouter Head
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public head(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("head", path, action);
    }

    /**
     * XpresserRouter Lock
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public lock(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("lock", path, action);
    }

    /**
     * XpresserRouter Merge
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public merge(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("merge", path, action);
    }

    /**
     * XpresserRouter Mkactivity
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public mkactivity(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("mkactivity", path, action);
    }

    /**
     * XpresserRouter Mkcol
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public mkcol(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("mkcol", path, action);
    }

    /**
     * XpresserRouter Move
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public move(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("move", path, action);
    }

    /**
     * XpresserRouter M-Search
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public mSearch(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("m-search", path, action);
    }

    /**
     * XpresserRouter Notify
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public notify(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("notify", path, action);
    }

    /**
     * XpresserRouter Options
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public options(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("options", path, action);
    }

    /**
     * XpresserRouter Patch
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public patch(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("patch", path, action);
    }

    /**
     * Patch Many Routes
     * @param {ManyRoutes} routes
     */
    public patchMany(routes: ManyRoutes): void {
        this.addManyRoutes("patch", routes);
    }

    /**
     * XpresserRouter Purge
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public purge(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("purge", path, action);
    }

    /**
     * XpresserRouter Post
     * @param {string} path
     * @param {string} [action]
     * @returns {RouterRoute}
     */
    public post(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("post", path, action);
    }

    /**
     * Post Many Routes
     * @param {ManyRoutes} routes
     */
    public postMany(routes: ManyRoutes): void {
        this.addManyRoutes("post", routes);
    }

    /**
     * XpresserRouter Report
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public report(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("report", path, action);
    }

    /**
     * XpresserRouter Put
     * @param {string} path
     * @param {string} [action]
     * @returns {RouterRoute}
     */
    public put(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("put", path, action);
    }

    /**
     * Put Many Routes
     * @param {ManyRoutes} routes
     */
    public putMany(routes: ManyRoutes): void {
        this.addManyRoutes("put", routes);
    }

    /**
     * XpresserRouter Search
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public search(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("search", path, action);
    }

    /**
     * XpresserRouter Subscribe
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public subscribe(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("subscribe", path, action);
    }

    /**
     * XpresserRouter Trace
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public trace(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("trace", path, action);
    }

    /**
     * XpresserRouter Unlock
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public unlock(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("unlock", path, action);
    }

    /**
     * XpresserRouter Get
     * @param {string} path
     * @param {StringOrFunction} [action]
     * @returns {RouterRoute}
     */
    public unsubscribe(path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        return this.addRoute("unsubscribe", path, action);
    }

    /**
     * Push Route To AllRoutes
     * @param method
     * @param path
     * @param action
     * @private
     * @return {RouterRoute}
     */
    public addRoute(method: string, path: StringOrRegExp, action?: StringOrFunction): RouterRoute {
        if (typeof path === "string" && action === undefined) {
            if (path.slice(0, 1) === "=") {
                action = path.slice(1);
                path = "";
            } else if (path.slice(0, 1) === "@") {
                let $case = snakeCase;

                // Switch case types.
                if (this.config.pathCase !== "snake") {
                    switch (this.config.pathCase) {
                        case "kebab":
                            $case = kebabCase;
                    }
                }

                path = path.slice(1);
                action = <string>path;
                path = $case(path as string);
            }
        }

        /**
         * if instance has namespace, action is string and action includes `@` but not `::`
         * We append namespace to action
         *
         * We exclude actions including `::`
         * because a namespace may want to point to another namespace controller methods
         */
        if (
            this.namespace &&
            typeof action === "string" &&
            action.includes("@") &&
            !action.includes("::")
        ) {
            action = this.namespace + "::" + action;
        }

        let eachRoute = new RouterRoute(method, path, action, this.namespace);
        this.routes.push(eachRoute);

        return eachRoute;
    }

    public addManyRoutes(method: string, routes: ManyRoutes): void {
        for (const route of routes) {
            if (typeof route === "string") {
                this.addRoute(method, route);
            } else if (Array.isArray(route)) {
                let [path, action, name]: RouteArray = route;

                // if shortHand validate true as second param.
                const firstChar = (path as string).slice(0, 1);
                if (firstChar === "@" || firstChar === "=") {
                    if (action && name === undefined) {
                        name = action;
                        action = undefined;
                    }
                }

                let thisRoute = this.addRoute(method, path, action as any);
                // Add name if has name
                if (name) name === true ? thisRoute.actionAsName() : thisRoute.name(name as string);
            }
        }
    }

    /**
     * Set routes connected to on controller.
     *
     * Works only in paths
     * @param controller
     * @param routes
     */
    public useController(controller: string, routes: (router: this) => void): RouterPath {
        return this.path("", routes).controller(controller);
    }
}

export default XpresserRouter;
