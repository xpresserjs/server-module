import BaseModule, {BaseModuleConfig} from "@xpresser/framework/modules/BaseModule.js";
import {BootCycleFunction} from "@xpresser/framework/engines/BootCycleEngine.js";
import type {Xpresser} from "@xpresser/framework/xpresser.js";
import type {ServerConfig} from "./types/index.js";
import type {XpresserHttpServerProvider} from "./provider.js";


/**
 * Add BootCycle types
 */

declare module "@xpresser/framework/engines/BootCycleEngine.js" {
    module BootCycle {
        enum Cycles {
            expressInit = "expressInit",
            serverInit = "serverInit",
            bootServer = "bootServer",
            http = "http",
            https = "https",
            serverBooted = "serverBooted"
        }
    }
}

/**
 * Add Modules Related Types
 */
declare module "@xpresser/framework/modules/BaseModule.js" {
    module Modules {
        enum Available {
            server = "ServerModule"
        }
    }
}

declare module "@xpresser/framework/types/configs.js" {
    module Config {
        interface Main {
            server?: Partial<ServerConfig>;
        }
    }
}

/**
 * This module handles the console section of the application.
 * key: cli
 */
class ServerModule extends BaseModule implements BaseModule {
    static config: BaseModuleConfig = {
        name: "Xpresser/ServerModule"
    }

    // ModulesEngine launch keyword
    static keyword: string = "server";

    static customBootCycles(): string[] {
        return [
            // list of boot cycles available on this module
            "serverInit",
            "expressInit",
            "bootServer",
            "http",
            "https",
            "serverBooted"
        ];
    }

    init() {
        if (this.initialized) return;

        // Add default config
        this.addDefaultConfig();

        // Run on started boot cycle
        this.$.on.started(
            BootCycleFunction("___SERVER_MODULE___", async (next) => {
                await this.boot();
                return next();
            })
        );

        // Mark as initialized.
        this.initialized = true;
    }

    addDefaultConfig() {
        const defaultConfig: ServerConfig = {
            maintenanceMiddleware: "MaintenanceMiddleware.js",
            port: 2000,
            protocol: "http",
            domain: "localhost",
            root: "/",
            includePortInUrl: true,
            baseUrl: "",
            poweredBy: true,
            servePublicFolder: true,

            ssl: {
                enabled: false,
                port: 443
            },

            use: {
                bodyParser: true,
                flash: false
            },

            router: {pathCase: "snake"}
        }

        const customConfig = this.$.config.data.server;
        if (customConfig) {
            this.$.config.setTyped("server", defaultConfig).merge(customConfig);
        } else {
            this.$.config.setTyped("server", defaultConfig);
        }
    }

    async boot() {
        console.log(this.$.config.data.server);
    }
}

export async function RegisterServerModule($: Xpresser, provider: XpresserHttpServerProvider) {
    await $.modules.register(ServerModule);
}



export default ServerModule;
