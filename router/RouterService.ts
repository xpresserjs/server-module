import Router from "./index.js";
import RouterPath from "./RouterPath.js";
import { RouteData } from "./RouterRoute.js";

/**
 * Router Service
 * Methods in this class are deliberately not added to the router because we want the router to be as light as possible.
 * And carry only the necessary methods for routing.
 */
class RouterService {
    /**
     * Router
     */
    protected router: Router;

    /**
     * Constructor
     * @param router
     */
    constructor(router: Router) {
        this.router = router;
    }

    /**
     * Use Router.
     * Same as constructor but for syntax sugar and easy chaining.
     */
    static use(router: Router) {
        return new RouterService(router);
    }

    /**
     * Convert router routes to JSON
     */
    toJson() {
        return JSON.stringify(this.toArray());
    }

    /**
     * Convert routes json value to object
     * This removes the controller function from the object
     */
    toJsonObject() {
        return JSON.parse(this.toJson());
    }

    /**
     * Convert routes to plain array
     */
    toArray(): RouteData[] {
        return this.parseRoutes();
    }

    /**
     * Convert routes to Map
     */
    toMap() {
        const map = new Map<string, RouteData>();
        for (const route of this.toArray()) {
            let path = route.path;

            // if path is a regex, convert to string
            if (path instanceof RegExp) path = path.source;

            // add method to path
            // this is to make sure that the path is unique
            path = route.method + " " + path;
            map.set(path, route);
        }

        return map;
    }

    /**
     * Convert routes to Map of path and controller
     * This is useful to get a fast lookup of routes
     */
    toControllerMap<Controller = any>() {
        const map = new Map<string, Controller>();
        for (const route of this.toArray()) {
            let path = route.path;

            // if path is a regex, convert to string
            if (path instanceof RegExp) path = path.source;

            // add method to path
            // this is to make sure that the path is unique
            path = route.method + " " + path;
            map.set(path, route.controller as unknown as Controller);
        }

        return map;
    }

    /**
     * Parse Routes
     * This transforms paths to routes
     */
    parseRoutes() {
        const arr = [] as RouteData[];
        for (const route of this.router.routes) {
            if (route instanceof RouterPath) {
                const routes = this.#parsePaths(route);
                arr.push(...routes);
            } else {
                arr.push(route.data);
            }
        }
        return arr;
    }

    /**
     * Parse Paths
     */
    #parsePaths(route: RouterPath, prevParentPath?: string): RouteData[] {
        const arr = [] as RouteData[];
        if (!route.data.children) return arr;

        for (const path of route.data.children) {
            // Parse each route
            // add the parent path to child path
            let parentPath = prevParentPath ?? route.data.path;
            let thisPath = path.data.path;

            if (parentPath instanceof RegExp) parentPath = parentPath.source;
            if (thisPath instanceof RegExp) thisPath = thisPath.source;

            // if thisPath is "/" then remove it
            if (thisPath === "/") thisPath = "";
            // add slash to this path if it doesn't have it
            if (thisPath.length && thisPath[0] !== "/") thisPath = "/" + thisPath;

            const newPath = parentPath + thisPath;

            if (path instanceof RouterPath) {
                arr.push(...this.#parsePaths(path, newPath));
                continue;
            }

            arr.push({
                ...path.data,
                path: newPath
            });
        }

        return arr;
    }
}

export default RouterService;
