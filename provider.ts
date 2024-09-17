import type { Xpresser } from "@xpresser/framework/xpresser.js";
import XpresserRouter from "./router/index.js";
import ServerEngine from "./engines/ServerEngine.js";
import moment from "moment";

/**
 * HttpServerProviderStructure - Http Server Provider Structure
 * This is the required structure for a custom http server provider
 *
 *  When creating variables or functions that should expect a custom http server provider,
 *  this structure should be used.
 */
export declare class HttpServerProviderStructure {
    /**
     * init - Initialize Server Provider
     * All initialization should be done here but no server should be started here.
     * E.g., Configurations and other setup before listening to server.
     *
     * This function is called when the server provider is being initialized.
     * This happens at the `boot` xpresser life cycle, before the `serverInit` cycle.
     *
     * @param $ Xpresser
     */
    public init($: Xpresser): Promise<void>;

    /**
     * boot - Boot Server Provider
     * This is where the server should be started.
     * This function is called when the server provider is being booted.
     * This happens after the `bootServer` cycle, before the `serverBooted` cycle.
     * @param $ Xpresser
     */
    public boot($: Xpresser): Promise<void>;

    /**
     * customBootCycles - Custom Boot Cycles required by this Provider.
     * If your provider requires custom boot cycles, you must return them here so they can be added to the boot cycle engine.
     * @returns string[]
     */
    public customBootCycles?(): string[];
}

// noinspection JSUnusedGlobalSymbols
/**
 * HttpServerProvider - Http Server Provider
 * The Base class for a custom http server provider.
 *
 * All custom http server providers should extend this class and implement the `HttpServerProviderStructure`.
 */
export class HttpServerProvider {
    /**
     * isProduction - Check if server is in production mode.
     * @protected
     */
    protected isProduction: boolean = false;

    /**
     * router - XpresserRouter instance
     * All routes will be added to this router.
     * @private
     */
    private router: XpresserRouter = new XpresserRouter();

    /**
     * setRouter - Set the router instance to be used by the provider.
     * @param router
     */
    setRouter<Router extends XpresserRouter>(router: Router) {
        this.router = router;
    }

    /**
     * getRouter - Get the router instance used by the provider.
     */
    getRouter<Router extends XpresserRouter>(): Router {
        return this.router as Router;
    }
}

/**
 * OnHttpListen - On Http Listen
 * This function is called when the server is listening.
 * It logs server domain, port, and other server related information.
 * @param $ Xpresser
 * @param port
 */
export function OnHttpListen($: Xpresser, port?: number) {
    // get port from config or use default 80
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
