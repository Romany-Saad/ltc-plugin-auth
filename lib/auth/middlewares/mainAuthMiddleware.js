"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
const mainAuthMiddleware = (app) => (req, res, next) => {
    console.log('main auth started');
    const authConfig = helpers_1.getEndpointAuthConfig(app, req.url, req.method);
    if (!authConfig) {
        res.status(403);
        next('access denied.');
    }
    else {
        next();
    }
};
exports.default = mainAuthMiddleware;
