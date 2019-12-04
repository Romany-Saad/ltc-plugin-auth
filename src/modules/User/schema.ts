import { InputTypeComposer, ObjectTypeComposer, schemaComposer } from 'graphql-compose'

export const UserTC = ObjectTypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [UserPermission]
    name: String
    roles: [String!]
}`, schemaComposer)

ObjectTypeComposer.create(`
type UserPermission {
  name: String!
  data: JSON
}
`, schemaComposer)

ObjectTypeComposer.create(`
type UserRole {
  name: String!
  permissions: [UserPermission!]!
  description: String
}
`, schemaComposer)

ObjectTypeComposer.create(`
type AuthedUser {
    id: ID!
    name: String
    token: String!
    permissions: [UserPermission!]!
    email: String!
}`, schemaComposer)

// ================== Input ===================

InputTypeComposer.create(`
input UserPermissionInput {
  name: String!
  data: JSON
}
`, schemaComposer)

InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    name: String
}`, schemaComposer)

InputTypeComposer.create(`
input Register {
    email: String!
    password: String!
    name: String
    grecaptchaToken: String!
}`, schemaComposer)

InputTypeComposer.create(`
input UserPatch {
    name: String
    permissions: [UserPermissionInput]
    status: String
    roles: [String!]
}`, schemaComposer)

InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [UserPermissionInput]
    name: String
}`, schemaComposer)
