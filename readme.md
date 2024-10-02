# XpresserJs Server Module

The server module for **xpresserjs v2**
This module provides a way to use different server providers with xpresserjs.

#### Features

- `Router` - A framework agnostic router.
- `Request` - A framework agnostic request engine.
- `Node Http Server` - A minimal production ready **Node Http Server** with native and xpresser request engine support.

## Installation

```bash
# if you don't have xpresser installed
npm install @xpresser/framework
# then install server module
npm install @xpresser/server-module
```

## Usage

```js
import { __dirname, init } from "@xpresser/framework/index.js";
import { useNodeHttpServerProvider } from "@xpresser/server-module/servers/NodeHttpServerProvider.js";

// Initialize Xpresser
const $ = await init({
    name: "My Xpresser App",
    env: "development",
    paths: { base: __dirname(import.meta.url) }
});

// Use Node Http Server Provider
const { router } = await useNodeHttpServerProvider($);

router.get("/", (http) => {
    http.send("Hello World!!");
});

await $.start();
```

### With Native Support

```js
import { __dirname, init } from "@xpresser/framework/index.js";
import { useNodeHttpServerProvider } from "@xpresser/server-module/servers/NodeHttpServerProvider.js";

// Initialize Xpresser
const $ = await init({
    name: "My Xpresser App",
    env: "development",
    paths: { base: __dirname(import.meta.url) }
});

// Use Node Http Server Provider
const { nativeRouter } = await useNodeHttpServerProvider($, {
    requestHandler: "native"
});

router.get("/", (req, res) => {
    res.end("Hello World!!");
});

await $.start();
```