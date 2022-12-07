import BaseModule, {type BaseModuleConfig} from "@xpresser/framework/modules/BaseModule.js";
import {type BootCycle, BootCycleFunction} from "@xpresser/framework/engines/BootCycleEngine.js";
import type {Xpresser} from "@xpresser/framework/xpresser.js";
import type {ServerConfig} from "./types/index.js";
import type {HttpServerProviderStructure} from "./provider.js";


/**
 * Add BootCycle types
 */

declare module "@xpresser/framework/engines/BootCycleEngine.js" {
    module BootCycle {
        enum Cycles {
            serverInit = "serverInit",
            bootServer = "bootServer",
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
            "serverInit",
            "bootServer",
            "serverBooted"
        ];
    }

    httpProvider!: HttpServerProviderStructure;

    async init() {
        if (this.initialized) return;

        // Log Server Start
        await this.serverStartLog()

        // Add default config
        this.addDefaultConfig();

        // Run on started boot cycle
        this.$.on.boot(
            BootCycleFunction("___SERVER_MODULE___", async (next) => {
                await this.boot();
                return next();
            })
        );

        // Mark as initialized.
        this.initialized = true;
    }

    private addDefaultConfig() {
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
            this.$.config.setTyped("server", defaultConfig).pathTyped("server").merge(customConfig);
        } else {
            this.$.config.setTyped("server", defaultConfig);
        }
    }

    private async boot() {
        // get provider
        const provider = this.httpProvider;
        // initialize provider
        await provider.init(this.$);

        // Run serverInit boot cycle
        await this.$.runBootCycle('serverInit');

        // Run bootServer boot cycle
        await this.$.runBootCycle('bootServer');

        // boot server
        await provider.boot(this.$);

        // Run serverBooted boot cycle
        await this.$.runBootCycle('serverBooted');
    }

    private async serverStartLog(){

        // import lodash
        const {default: {startCase}} = await import('lodash');
        // import chalk
        const {default: chalk} = await import('chalk');

        const $ = this.$;

        // Log Xpresser Version
        const PackageDotJson = $.engineData.data.packageDotJson.data as any;
        $.console.logCalmly(`${PackageDotJson.name} version ${PackageDotJson.version}`);

        // Log Project Name
        let {name, env} = $.config.data;
        if (env) {
            env = startCase(env);
            env = env.toLowerCase() === "development" ? chalk.yellow(`(${env})`) : chalk.greenBright(`(${env})`);
            env = chalk.yellow(env);
        }


        $.console.log(`${name} ${env}`.trim());
    }
}

export async function RegisterServerModule($: Xpresser, provider: HttpServerProviderStructure) {
    await $.modules.register(ServerModule);

    // check if provider has custom boot cycles
    if (provider.customBootCycles) {
        // register boot cycles
        const customCycles = provider.customBootCycles();
        if (customCycles.length) {
            // if true, add custom cycles to boot cycles
            $.addBootCycle(customCycles as BootCycle.Keys[]);
        }
    }

    $.on.beforeStart(BootCycleFunction("SetServerModuleProvider", (next) => {
        // get active module
        const activeModule = $.modules.getActiveInstance<ServerModule>()
        // set provider
        activeModule.httpProvider = provider;
        next()
    }));
}


export default ServerModule;
