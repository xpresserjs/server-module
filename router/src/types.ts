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
    children?: RoutePathData[];
    useActionsAsName?: boolean;
}

export type StringOrRegExp = string | RegExp;
export type RouteHandlerFunction<Fn extends Function> = Fn | string;
export type RouteArray = [StringOrRegExp, (string | boolean)?, (string | boolean)?];
export type ManyRoutes = string[] | RouteArray[] | (string | RouteArray)[];
