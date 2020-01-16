"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_compose_1 = require("graphql-compose");
exports.RoleTC = graphql_compose_1.ObjectTypeComposer.create(`
type Role {
  id: ID!
  name: String!
  permissions: [RolePermission!]!
  description: String
}`, graphql_compose_1.schemaComposer);
graphql_compose_1.ObjectTypeComposer.create(`
type Roles {
  items: [Role!]!
  totalCount: Int!
}`, graphql_compose_1.schemaComposer);
graphql_compose_1.schemaComposer.getOTC('Roles')
    .setField('configRoles', {
    type: '[RolePermission!]!',
    resolve: (source, args, context, info) => {
        const app = info.rootValue;
        const roles = app.config().get('auth.roles');
        return roles || [];
    },
});
graphql_compose_1.ObjectTypeComposer.create(`
type RolePermission {
  name: String!
  data: JSON
}`, graphql_compose_1.schemaComposer);
// ============= input ====================
graphql_compose_1.InputTypeComposer.create(`
input RolePermissionInput {
  name: String!
  data: JSON
}`, graphql_compose_1.schemaComposer);
graphql_compose_1.InputTypeComposer.create(`
input NewRole {
  name: String!
  permissions: [RolePermissionInput!]!
  description: String
}`, graphql_compose_1.schemaComposer);
graphql_compose_1.InputTypeComposer.create(`
input RolePatch {
  name: String
  permissions: [RolePermissionInput!]
  description: String
}`, graphql_compose_1.schemaComposer);
