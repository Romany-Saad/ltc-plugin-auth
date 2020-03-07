"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UrlPattern = require('url-pattern');
exports.graphQlDefaultAuth = (next) => (obj, args, context, info) => {
    const endpoint = info.fieldName;
    // check if user permissions has endpoint
    if (context.user && context.user.permissions.find((p) => p.name === endpoint) != undefined) {
        return next(obj, args, context, info);
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
            const pattern = new UrlPattern(config.path, {
                segmentValueCharset: 'a-zA-Z0-9-_~ %\.',
            });
            const trimmedEndpoint = endpoint.split('?')[0];
            return pattern.match(trimmedEndpoint) && (config.method === httpMethod);
        });
        return endpointAuthConfig === undefined ? null : endpointAuthConfig;
    }
    return true;
};
