"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
graphql_compose_1.TypeComposer.create(`
type Permission {
    id: ID!
    name: String!
}`);
graphql_compose_1.InputTypeComposer.create(`
input NewPermission {
    name: String!

}`);
graphql_compose_1.InputTypeComposer.create(`
input PermissionPatch {
    name: String

}`);
graphql_compose_1.InputTypeComposer.create(`
input PermissionCount {
    name: String
}`);
/*

extend type Query {
    getPermissions: [Permission!]!
    getPermission(id: ID!): [Permission!]!
    countPermissions(input: PermissionCount): Int!
}

extend type Mutation {
    addPermission(input: NewPermission): Permission!
    updatePermission(id: ID!, input: PermissionPatch): Permission!
    deletePermission(id: ID!): Boolean!
}
*/
