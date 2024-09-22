import NodeHttpServerProvider, {
    NodeHttpServerProviderConfig
} from "../../servers/NodeHttpServerProvider.js";
import { ServerResponse } from "node:http";

export async function SetupXpresser(config?: NodeHttpServerProviderConfig) {
    const { init, __dirname } = await import("@xpresser/framework");

    // Get Base Folder Path
    const base = __dirname(import.meta.url);

    // Init Xpresser
    const $ = await init({
        env: "development",
        name: "Node Server",
        debug: {
            enabled: true,
            bootCycle: { started: false, completed: false },
            bootCycleFunction: { started: false, completed: false }
        },
        paths: { base },
        log: { asciiArt: false }
    });

    $.onNext("stopped", function LogOnStop() {
        // Log Calmly
        $.console.logInfo(`<----- ${$.config.data.name} stopped. ----->`);
    });

    // Register Node Server Module with Xpresser
    const nodeServer = new NodeHttpServerProvider(config);

    return { $, nodeServer };
}

/**
 * Respond with text
 * @param res
 * @param text
 */
export function respond(res: ServerResponse, text: string | number) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(text);
}
