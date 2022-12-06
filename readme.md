# XpresserJs Server Module

The server module for **xpresserjs v2**

## Installation

```bash
npm install @xpresser/server-module
```

## Usage

```js
import {RegisterServerModule} from "@xpresser/server-module";
import ExpressProvider from "@xpresser/express-server-module-provider";

await RegisterServerModule($,  new ExpressProvider);
```