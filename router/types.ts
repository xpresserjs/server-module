import type RouterRoute from "./RouterRoute.js";
import type RouterPath from "./RouterPath.js";

export type Routes = Array<RouterRoute | RouterPath>;

export interface RouteData {
    method?: string;
    name?: string;
    path: StringOrRegExp;
    controller?: RouteHandlerFunction<Function>;
}

export interface RoutePathData {
    method?: string;
    path: StringOrRegExp;
    controller?: string;
    middleware?: string | string[];
    as?: string;
    children?: Routes;
    useActionsAsName?: boolean;
}

export type StringOrRegExp = string | RegExp;
export type RouteHandlerFunction<Fn extends Function> = Fn | string;
export type RouteArray = [StringOrRegExp, (string | boolean)?, (string | boolean)?];
export type ManyRoutes = string[] | RouteArray[] | (string | RouteArray)[];
