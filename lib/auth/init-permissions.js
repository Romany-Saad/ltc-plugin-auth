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
const index_1 = require("../index");
exports.initPermissions = (app) => __awaiter(this, void 0, void 0, function* () {
    // get existing endpoints in database
    const permissionsRepo = app.get(index_1.names.AUTH_PERMISSIONS_REPOSITORY);
    const databasesPermissions = yield permissionsRepo.find({});
    let databaseEndpoints = databasesPermissions.map(permission => {
        return permission.data.endpoint;
    });
    // get all endpoints from plugins
    let queryEndpoints = graphql_compose_1.schemaComposer.rootQuery().getFields();
    let mutationEndpoints = graphql_compose_1.schemaComposer.rootMutation().getFields();
    // TODO: find a workaround to add subscriptions
    // let subscriptionEndpoints = schemaComposer.Subscription.getFields()
    // get all the endpoints that doesn't exist in db
    let newEndpoints = [];
    for (let endpoint in queryEndpoints) {
        if (databaseEndpoints.indexOf(endpoint) === -1) {
            newEndpoints.push(permissionsRepo.parse({
                endpoint: endpoint,
                name: endpoint,
                protected: true,
                type: 'query',
            }));
        }
    }
    for (let endpoint in mutationEndpoints) {
        if (databaseEndpoints.indexOf(endpoint) === -1) {
            newEndpoints.push(permissionsRepo.parse({
                endpoint: endpoint,
                name: endpoint,
                protected: true,
                type: 'mutation',
            }));
        }
    }
    /*for (let endpoint in subscriptionEndpoints) {
      console.log(endpoint)
      if (databaseEndpoints.indexOf(endpoint) === -1) {
        newEndpoints.push(permissionsRepo.parse({
          endpoint: endpoint,
          name: endpoint,
          protected: true,
          type: 'subscription',
        }))
      }
    }*/
    if (newEndpoints.length) {
        permissionsRepo.insert(newEndpoints)
            .catch(err => {
            throw new Error(err);
        });
    }
});
