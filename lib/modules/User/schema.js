"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
exports.UserTC = graphql_compose_1.TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [UserPermission]
    name: String
    roles: [String!]
    authentication: JSON
}`);
graphql_compose_1.TypeComposer.create(`
type UserPermission {
  name: String!
  data: JSON
}
`);
graphql_compose_1.TypeComposer.create(`
type UserRole {
  name: String!
  permissions: [UserPermission!]!
  description: String
}
`);
graphql_compose_1.InputTypeComposer.create(`
input UserPermissionInput {
  name: String!
  data: JSON
}
`);
graphql_compose_1.TypeComposer.create(`
type AuthedUser {
    id: ID!
    name: String
    token: String!
    permissions: [UserPermission!]!
    email: String!
}`);
graphql_compose_1.InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    name: String
}`);
graphql_compose_1.InputTypeComposer.create(`
input Register {
    email: String!
    password: String!
    name: String
    grecaptchaToken: String!
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserPatch {
    name: String
    permissions: [UserPermissionInput]
    status: String
    roles: [String!]
}`);
graphql_compose_1.InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [UserPermissionInput]
    name: String
}`);
