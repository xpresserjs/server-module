export interface ServerConfig {
    /**
     * Middleware to handle server under maintenance mood
     * if not found default is used.
     */
    maintenanceMiddleware: string;

    /**
     * Server Port for http connections
     */
    port: number;

    /**
     * Url protocol (http|https)
     * Use https if ssl is enabled.
     */
    protocol: "http" | "https";

    /**
     * Server domain
     * e.g "localhost"
     */
    domain: string;

    /**
     * Root Folder
     * if calling xpresser from another folder not route
     * specify e.g.  root: '/folder/'
     *
     * must end with trailing slash
     */
    root: `${string}/`;

    /**
     * In most development environment this is required to be true.
     * When true url helpers will append server port after server url
     *
     * @example
     * http://localhost:2000/some/path
     */
    includePortInUrl: boolean;

    /**
     * Specify Application BaseUrl directly
     */
    baseUrl: string;

    /**
     * SSL Configurations.
     */
    ssl: {
        /**
         * Enable ssl
         * default: false
         */
        enabled: boolean;

        /**
         * Ssl Port (if ssl is enabled)
         * default: 443
         */
        port: number;
    };

    /**
     * Enable or disable PoweredBy
     * For security purposes this is advised to be false.
     * default: xpresser
     */
    poweredBy: boolean;

    /**
     * Enable if you want public folder to be served
     */
    servePublicFolder: boolean;

    /**
     * Xpresser comes with a few packages for security,
     * You can enable or disable them here.
     * ['bodyParser', 'flash' 'helmet']
     */
    use: {
        /**
         * Use bodyParser package.
         */
        bodyParser: boolean;

        /**
         * Enable Flash package.
         */
        flash: boolean;
    };

    // requestEngine: {
    //     dataKey: "data";
    //     proceedKey: "proceed";
    //     messageKey: "_say";
    // };

    /**
     * Xpresser Router Config
     */
    router: {
        /**
         * Route url path case
         */
        pathCase: "snake" | "kebab"; // snake or kebab
    };
}


export declare class XpresserHttpServerProvider {
    public initialize(): Promise<void>;
}