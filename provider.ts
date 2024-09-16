import type { Xpresser } from "@xpresser/framework/xpresser.js";
import XpresserRouter from "./router/index.js";
import ServerEngine from "./engines/ServerEngine.js";
import moment from "moment";

export declare class HttpServerProviderStructure {
    public init($: Xpresser): Promise<void>;

    public boot($: Xpresser): Promise<void>;

    public customBootCycles?(): string[];
}

export class HttpServerProvider {
    protected initialized: boolean = false;
    protected isProduction: boolean = false;
    private router: XpresserRouter = new XpresserRouter();

    setRouter<Router extends XpresserRouter>(router: Router) {
        this.router = router;
    }

    getRouter<Router extends XpresserRouter>(): Router {
        return this.router as Router;
    }
}

/**
 *
 * @param $ Xpresser
 * @param port
 */
export function OnHttpListen($: Xpresser, port?: number) {
    port = port ? port : $.config.data.server?.port || 80;
    const serverDomainAndPort = $.config.get("log.serverDomainAndPort");
    const domain = $.config.getTyped("server.domain");
    const serverEngine = $.engine(ServerEngine);
    const baseUrl = serverEngine.url().trim();
    const lanIp = $.engineData.get("lanIp");
    const ServerStarted = new Date();

    const getServerUptime = () => moment(ServerStarted).fromNow();

    if (serverDomainAndPort || baseUrl === "" || baseUrl === "/") {
        $.console.log(`Domain: ${domain} | Port: ${port} | BaseUrl: ${baseUrl}`);
    } else {
        $.console.log(`Url: ${baseUrl}`);
    }

    /**
     * Show Lan Ip in development mood
     */
    if (lanIp) $.console.log(`Network: http://${lanIp}:${port}/`);

    /**
     * Show Server Started Time only on production
     */
    $.console.log(`Server started - ${ServerStarted.toString()}`);

    // Save values to engineData
    $.engineData.set({ ServerStarted, getServerUptime });
}
