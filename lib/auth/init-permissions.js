"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
const helpers_1 = require("./helpers");
exports.initPermissions = (app, unprotectedEndpoints = [], customPermissions) => __awaiter(this, void 0, void 0, function* () {
    const authConfigs = loadAuthConfigs(app, unprotectedEndpoints);
    const authPlugin = app.getPlugin('cyber-crafts.cms-plugin-auth');
    authPlugin.setGraphQlAuthConfig(authConfigs.graphql);
    authPlugin.setRestAuthConfig(authConfigs.rest);
    authPlugin.setAvailablePermissions(customPermissions);
    app.emitter.emit('PERMISSIONS_INIT_DONE', authPlugin.availablePermissions);
});
function loadAuthConfigs(app, unprotectedEndpoints) {
    const graphqlAuthConfigs = getGraphQlAuthConfigs();
    const restEndpoints = getAvailableRoutes(app);
    const restAuthConfigs = restEndpoints.map((endpoint) => {
        endpoint.authorize = helpers_1.restDefaultAuth;
        return endpoint;
    });
    return {
        graphql: graphqlAuthConfigs,
        rest: restAuthConfigs,
    };
}
function getGraphQlAuthConfigs() {
    let queryEndpoints = graphql_compose_1.schemaComposer.rootQuery().getFields();
    let mutationEndpoints = graphql_compose_1.schemaComposer.rootMutation().getFields();
    const graphqlAuthConfigs = [];
    for (let endpoint in queryEndpoints) {
        let data = {
            endpoint: endpoint,
            name: endpoint,
            protected: true,
            type: 'query',
            authorize: helpers_1.graphQlDefaultAuth
        };
        /*if (unprotectedEndpoints.indexOf(endpoint) > -1) {
          data.protected = false
        }*/
        graphqlAuthConfigs.push(data);
    }
    for (let endpoint in mutationEndpoints) {
        let data = {
            endpoint: endpoint,
            name: endpoint,
            protected: true,
            type: 'mutation',
            authorize: helpers_1.graphQlDefaultAuth
        };
        /*if (unprotectedEndpoints.indexOf(endpoint) > -1) {
          data.protected = false
        }*/
        graphqlAuthConfigs.push(data);
    }
    return graphqlAuthConfigs;
}
function getAvailableRoutes(app) {
    return app.express._router.stack
        .filter((r) => r.route)
        .map((r) => {
        return {
            method: Object.keys(r.route.methods)[0].toUpperCase(),
            path: r.route.path,
        };
    });
}
