import { TypeComposer, InputTypeComposer } from "graphql-compose"

export const UserTC = TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [String]
    name: String
}`)


TypeComposer.create(`
type AuthedUser {
    id: ID!
    name: String
    token: String!
    permissions: [String!]!
    email: String!
}`)

InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    name: String
}`)

InputTypeComposer.create(`
input UserPatch {
    name: String
    permissions: [String]
}`)

InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [String]
    name: String
}`)
