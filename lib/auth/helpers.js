"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//TODO: figure out the logic for these 2
exports.graphQlDefaultAuth = (next) => (rp) => {
    return next(rp);
};
exports.restDefaultAuth = (req, res, next) => {
    next();
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
