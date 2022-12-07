import type {Xpresser} from "@xpresser/framework/xpresser.js";

export declare class HttpServerProviderStructure {
    public init($: Xpresser): Promise<void>;
    public boot($: Xpresser): Promise<void>;
    public  customBootCycles?(): string[];
}

export class HttpServerProvider {
    protected initialized: boolean = false
}

