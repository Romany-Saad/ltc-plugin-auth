"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
exports.UserTC = graphql_compose_1.TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [ID]
    name: String
}`);
graphql_compose_1.TypeComposer.create(`
type AuthedUser {
    id: ID!
    name: String
    token: String!
    permissions: [String!]!
    email: String!
}`);
graphql_compose_1.InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    name: String
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserPatch {
    name: String
    permissions: [ID]
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [ID]
    name: String
}`);
