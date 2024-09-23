import type RouterRoute from "./RouterRoute.js";
import type RouterPath from "./RouterPath.js";

export type Routes = Array<RouterRoute | RouterPath>;
export type StringOrRegExp = string | RegExp;
export type RouteHandlerFunction<Fn extends Function> = Fn | string;
export type RouteArray = [StringOrRegExp, (string | boolean)?, (string | boolean)?];
export type ManyRoutes = string[] | RouteArray[] | (string | RouteArray)[];
