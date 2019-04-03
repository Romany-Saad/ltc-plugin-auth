"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
exports.PermissionTC = graphql_compose_1.TypeComposer.create(`
type Permission {
    name: String!
    endpoint: String!
    protected: Boolean!
    type: String!
}`);
/*

InputTypeComposer.create(`
input NewPermission {
    name: String!
    endpoint: String!
    protected: Boolean!
}`)

InputTypeComposer.create(`
input PermissionPatch {
    name: String
    endpoint: String
    protected: Boolean
}`)
*/
graphql_compose_1.InputTypeComposer.create(`
input PermissionCount {
    type: String
    name: String
    endpoint: String
    protected: Boolean
}`);
