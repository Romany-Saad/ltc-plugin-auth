"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
graphql_compose_1.ObjectTypeComposer.create(`
type PasswordReset {
    id: ID!
    userId: ID!
    secretCode: String!
    createdAt: Date!
    state: String!
}`, graphql_compose_1.schemaComposer);
graphql_compose_1.InputTypeComposer.create(`
input PasswordResetCount {
    userId: ID
    secretCode: String
    createdAt: Date
    state: String
}`, graphql_compose_1.schemaComposer);
