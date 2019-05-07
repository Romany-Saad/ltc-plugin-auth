import { InputTypeComposer, TypeComposer } from 'graphql-compose'

export const UserTC = TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [UserPermission]
    name: String
    roles: [String!]
}`)

TypeComposer.create(`
type UserPermission {
  name: String!
  data: JSON
}
`)

TypeComposer.create(`
type UserRole {
  name: String!
  permissions: [UserPermission!]!
  description: String
}
`)

InputTypeComposer.create(`
input UserPermissionInput {
  name: String!
  data: JSON
}
`)

TypeComposer.create(`
type AuthedUser {
    id: ID!
    name: String
    token: String!
    permissions: [UserPermission!]!
    email: String!
}`)

InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    name: String
}`)

InputTypeComposer.create(`
input Register {
    email: String!
    password: String!
    name: String
    grecaptchaToken: String!
}`)

InputTypeComposer.create(`
input UserPatch {
    name: String
    permissions: [UserPermissionInput]
    status: String
    roles: [String!]
}`)

InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [UserPermissionInput]
    name: String
}`)
