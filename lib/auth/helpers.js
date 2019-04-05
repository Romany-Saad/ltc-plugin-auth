"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UrlPattern = require('url-pattern');
exports.graphQlDefaultAuth = (next) => (rp) => {
    const endpoint = rp.info.fieldName;
    // check if user permissions has endpoint
    if (rp.context.user && rp.context.user.permissions.find((p) => p.name === endpoint) != undefined) {
        return next(rp);
    }
    else {
        throw new Error('permissions denied');
    }
};
exports.graphQlDefaultUnprotectedAuth = (next) => (rp) => {
    return next(rp);
};
exports.restDefaultAuth = (route) => (req, res, next) => {
    if (req.user && req.user.permissions.find((p) => p.name === route) != undefined) {
        next();
    }
    else {
        throw new Error('permissions denied');
    }
};
exports.restDefaultUnprotectedAuth = (route) => (req, res, next) => {
    next();
};
exports.getEndpointAuthConfig = (app, endpoint, httpMethod) => {
    const authPlugin = app.getPlugin('cyber-crafts.cms-plugin-auth');
    const authConfigs = authPlugin.authConfig;
    const graphqlMatch = endpoint.match(/\/graphql.*/g);
    if (graphqlMatch === null) {
        const endpointAuthConfig = authConfigs.rest.find((config) => {
            const pattern = new UrlPattern(config.path);
            return pattern.match(endpoint) && (config.method === httpMethod);
        });
        return endpointAuthConfig === undefined ? null : endpointAuthConfig;
    }
    return true;
};
