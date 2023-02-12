import BaseEngine from "@xpresser/framework/engines/BaseEngine.js";
import buildUrl from "@googlicius/build-url";

class ServerEngine extends BaseEngine {
    static config = {
        name: "Xpresser/ServerEngine"
    };

    /**
     * Get full url of path
     * @param {string} $path
     * @param {object} $query
     */
    url($path: string = "", $query: any = {}) {
        let url: string;
        const server = this.$.config.getTyped("server")!;

        if ($path.substring(0, 1) === "/") $path = $path.substring(1);

        if (server.baseUrl && server.baseUrl.length) {
            url = server.baseUrl + $path;
        } else {
            let d = server.domain;
            let p = server.protocol;

            if (server.includePortInUrl && server.port !== 80 && server.port !== 443) {
                d = d + ":" + server.port;
            }

            if (this.$.config.get("server.ssl.enabled", false)) {
                p = "https";
            }

            url = p + "://" + d + server.root + $path;
        }

        if (Object.keys($query).length) {
            // @ts-ignore
            url = buildUrl(url, {
                queryParams: $query
            });
        }

        return url;
    }
}

export default ServerEngine;
