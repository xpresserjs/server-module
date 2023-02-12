import BaseModule, { type BaseModuleConfig } from "@xpresser/framework/modules/BaseModule.js";
import { type BootCycle, BootCycleFunction } from "@xpresser/framework/engines/BootCycleEngine.js";
import type { Xpresser } from "@xpresser/framework/xpresser.js";
import type { ServerConfig } from "./types/index.js";
import type { HttpServerProviderStructure } from "./provider.js";

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
            server: Partial<ServerConfig.Main>;
        }
    }
}

/**
 * Server Module
 * key: server
 */
class ServerModule extends BaseModule implements BaseModule {
    static config: BaseModuleConfig = {
        name: "Xpresser/ServerModule",
        keyword: "server",
        description: "Xpresser Http Server Module"
    };

    static customBootCycles(): string[] {
        return ["serverInit", "bootServer", "serverBooted"];
    }

    /**
     * Http Provider
     * Holds The instance of the registered http provider.
     */
    httpProvider!: HttpServerProviderStructure;

    /**
     * Initialize Server Module
     * - Add default Configurations
     * - Add `$.on.boot` Cycle Function to start server.
     * - Set server module as initialized.
     */
    async init() {
        // if already initialized return.
        if (this.initialized) return;

        // Add default config
        this.#addDefaultConfig();

        // Run on started boot cycle
        this.$.on.boot(
            BootCycleFunction(ServerModule.prependName("Boot"), async (next) => {
                // Log Server Start
                await this.#serverStartLog();
                await this.#boot();
                return next();
            })
        );

        // Mark as initialized.
        this.initialized = true;
    }

    /**
     * Default Server Configuration
     */
    defaultConfig(): ServerConfig.Main {
        return {
            maintenanceMiddleware: "MaintenanceMiddleware.js",
            port: 2000,
            protocol: "http",
            domain: "localhost",
            root: "/",
            includePortInUrl: true,
            baseUrl: "",
            poweredBy: true,
            servePublicFolder: true,
            forceHttpToHttps: false,

            ssl: {
                enabled: false,
                port: 443
            },

            use: {
                bodyParser: true,
                flash: false,
                cors: false
            },

            router: { pathCase: "snake" },

            configs: {
                cors: undefined
            }
        };
    }

    #addDefaultConfig() {
        const defaultConfig: ServerConfig.Main = this.defaultConfig();

        const customConfig = this.$.config.data.server;
        if (customConfig) {
            this.$.config.setTyped("server", defaultConfig).pathTyped("server").merge(customConfig);
        } else {
            this.$.config.setTyped("server", defaultConfig);
        }
    }

    async #boot() {
        // get provider
        const provider = this.httpProvider;
        // initialize provider
        await provider.init(this.$);

        // Run serverInit boot cycle
        await this.$.runBootCycle("serverInit");

        // Run bootServer boot cycle
        await this.$.runBootCycle("bootServer");

        // boot server
        await provider.boot(this.$);

        // Run serverBooted boot cycle
        await this.$.runBootCycle("serverBooted");
    }

    async #serverStartLog() {
        // import lodash
        const { startCase } = await import("lodash-es");
        // import chalk
        const { default: chalk } = await import("chalk");

        const $ = this.$;

        // Log Project Name
        let { name, env } = $.config.data;
        if (env) {
            env = startCase(env);
            env =
                env.toLowerCase() === "development"
                    ? chalk.yellow(`(${env})`)
                    : chalk.greenBright(`(${env})`);
            env = chalk.yellow(env);
        }

        $.console.log(`${name} ${env}`.trim());
    }
}

/**
 * Register Server Module
 * This function is called by the provider
 * @param $
 * @param provider
 * @example
 *
 * const provider = new HttpServerProvider();
 * await RegisterServerModule($, provider);
 */
export async function RegisterServerModule($: Xpresser, provider: HttpServerProviderStructure) {
    let customCycles: string[] = [];

    // check if provider has custom boot cycles
    if (provider.customBootCycles) {
        customCycles = provider.customBootCycles();
    }

    // Register Module
    await $.modules.register(ServerModule, {
        // add provider custom boot cycles
        addBootCycles: customCycles as BootCycle.Cycles[]
    });

    /**
     * Set Server Module Provider
     * This is done before server starts
     * The httpProvider is set on the active module
     */
    $.on.beforeStart(
        BootCycleFunction(ServerModule.prependName("SetServerModuleProvider"), (next) => {
            // get active module
            const activeModule = $.modules.getActiveInstance<ServerModule>();

            // set provider
            activeModule.httpProvider = provider;

            // continue
            next();
        })
    );
}

export default ServerModule;
