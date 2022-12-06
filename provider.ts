import {Xpresser} from "@xpresser/framework/xpresser.js";

export declare class XpresserHttpServerProvider {
    public initialize(): Promise<void>;
}

export class HttpServerProvider {
    protected initialized: boolean = false
    public constructor(protected readonly $: Xpresser) {
    }
}

