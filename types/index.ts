declare module ServerConfig {
    export interface Main {
        /**
         * Server Name
         * if set it will override the default server name.
         */
        name?: string;
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
         * Force http to https
         * default: false
         */
        forceHttpToHttps: boolean;

        /**
         * SSL Configurations.
         */
        ssl: Ssl

        /**
         * Enable or disable PoweredBy
         * For security purposes this is advised to be false.
         * default: xpresser
         */
        poweredBy: boolean | string;

        /**
         * Enable if you want public folder to be served
         */
        servePublicFolder: boolean;

        /**
         * Xpresser comes with a few packages for security,
         * You can enable or disable them here.
         * ['bodyParser', 'flash' 'helmet']
         */
        use: Use;


        /**
         * Xpresser Router Config
         */
        router: Router;


        /**
         * configs - This object holds the configs for all server module related packages.
         * example: cors, helmet, etc
         */
        configs: Configs
    }

    export interface Router {
        /**
         * Route url path case
         */
        pathCase: "snake" | "kebab"; // snake or kebab

    }

    export interface Configs {
        cors?: any;
    }

    export interface Ssl {
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
    }

    export interface Use {
        /**
         * Enable BodyParser support.
         */
        bodyParser: boolean;

        /**
         * Enable Flash support.
         */
        flash: boolean;


        /**
         * Enable cors support.
         */
        cors: boolean;
    }
}


export type {ServerConfig};

