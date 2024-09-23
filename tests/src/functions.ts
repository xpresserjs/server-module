import { Xpresser } from "@xpresser/framework";
import { ServerResponse } from "node:http";

export async function SetupXpresser() {
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

    return $;
}

/**
 * Tear down Xpresser
 * @param $
 * @constructor
 */
export async function TearDownXpresser($: Xpresser) {
    await $.stop();
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
