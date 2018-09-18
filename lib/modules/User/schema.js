"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
graphql_compose_1.TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`);
graphql_compose_1.TypeComposer.create(`
type AuthedUser {
    id: ID!
    username: String!
    token: String!
    permissions: [String!]!
}`);
graphql_compose_1.InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserPatch {
    email: String
    password: String
    status: String
    permissions: [String]
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`);
