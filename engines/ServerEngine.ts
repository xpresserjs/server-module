import BaseEngine from "@xpresser/framework/engines/BaseEngine.js";
import queryString from "query-string";

class ServerEngine extends BaseEngine {
    static config = {
        name: "Xpresser/ServerEngine"
    };

    public baseUrl?: string;

    /**
     * Get full url of path
     * @param {string} $path
     * @param {object} $query
     */
    url($path: string = "", $query: any = {}) {
        if (!this.baseUrl) {
            const server = this.$.config.getTyped("server")!;

            if (server.baseUrl && server.baseUrl.length) {
                this.baseUrl = server.baseUrl;
            } else {
                let d = server.domain;
                let p = server.protocol;

                if (server.includePortInUrl && server.port !== 80 && server.port !== 443) {
                    d = d + ":" + server.port;
                }

                if (this.$.config.get("server.ssl.enabled", false)) {
                    p = "https";
                }

                this.baseUrl = p + "://" + d + server.root;
            }
        }

        if ($path[0] === "/") $path = $path.substring(1);
        let url = this.baseUrl + $path;

        if (Object.keys($query).length) {
            const query = queryString.stringify($query);
            url = url + "?" + query;
        }

        return url;
    }
}

export default ServerEngine;
