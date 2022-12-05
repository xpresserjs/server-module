import {XpresserHttpServerProvider} from "../../types/index.js";

class ExpressProvider implements XpresserHttpServerProvider {
    constructor() {
    }

    async initialize() {
        // import express
        // const express = await import('express');
    }
}

export default ExpressProvider;