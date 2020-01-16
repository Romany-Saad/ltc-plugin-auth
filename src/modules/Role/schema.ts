import { InputTypeComposer, ObjectTypeComposer, schemaComposer } from 'graphql-compose'

export const RoleTC = ObjectTypeComposer.create(`
type Role {
  id: ID!
  name: String!
  permissions: [RolePermission!]!
  description: String
}`, schemaComposer)


ObjectTypeComposer.create(`
type Roles {
  items: [Role!]!
  totalCount: Int!
}`, schemaComposer)
schemaComposer.getOTC('Roles')
  .setField('configRoles', {
    type: '[RolePermission!]!',
    resolve: (source, args, context, info) => {
      const app = info.rootValue
      const roles = app.config().get('auth.roles')
      return roles || []
    },
  })

ObjectTypeComposer.create(`
type RolePermission {
  name: String!
  data: JSON
}`, schemaComposer)

// ============= input ====================

InputTypeComposer.create(`
input RolePermissionInput {
  name: String!
  data: JSON
}`, schemaComposer)

InputTypeComposer.create(`
input NewRole {
  name: String!
  permissions: [RolePermissionInput!]!
  description: String
}`, schemaComposer)

InputTypeComposer.create(`
input RolePatch {
  name: String
  permissions: [RolePermissionInput!]
  description: String
}`, schemaComposer)
