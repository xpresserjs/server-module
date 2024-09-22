import { configure, processCLIArgs, run } from "@japa/runner";
import { assert } from "@japa/assert";
import { apiClient } from "@japa/api-client";

processCLIArgs(process.argv.splice(2));
configure({
    files: [
        // "tests/**/*.spec.ts",
        // "tests/router-service.spec.ts"
        "tests/node-test-server-module.spec.ts"
    ],
    plugins: [assert(), apiClient("http://localhost:2000")]
});

run();
