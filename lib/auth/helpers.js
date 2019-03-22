"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphQlDefaultAuth = (next) => (rp) => {
    // get the endpoint
    const endpoint = 'something';
    // check if user permissions has endpoint
    if (rp.context.user && rp.context.user.permissions.find((p) => p.name === endpoint) != undefined) {
        return next(rp);
    }
    else {
        throw new Error('permissions denied');
    }
};
exports.restDefaultAuth = (req, res, next) => {
    const endpoint = req.url;
    if (req.user && req.user.permissions.find((p) => p.name === endpoint) != undefined) {
        next();
    }
    else {
        throw new Error('permissions denied');
    }
};
exports.getEndpointAuthConfig = (app, endpoint, httpMethod) => {
    const authPlugin = app.getPlugin('cyber-crafts.cms-plugin-auth');
    const authConfigs = authPlugin.authConfig;
    const g = endpoint.match(/\/graphql.*/g);
    if (g === null) {
        const endpointAuthConfig = authConfigs.rest.find((config) => {
            return config.endpoint === endpoint;
        });
        return endpointAuthConfig === undefined ? null : endpointAuthConfig;
    }
    return true;
};
