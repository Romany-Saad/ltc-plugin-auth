import { TypeComposer, InputTypeComposer } from "graphql-compose"

TypeComposer.create(`
type User {
    id: ID!
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`)


TypeComposer.create(`
type AuthedUser {
    id: ID!
    username: String!
    token: String!
    permissions: [String!]!
}`);

InputTypeComposer.create(`
input NewUser {
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`)

InputTypeComposer.create(`
input UserPatch {
    email: String
    password: String
    status: String
    permissions: [String]
}`)

InputTypeComposer.create(`
input UserCount {
    email: String!
    password: String!
    status: String!
    permissions: [String]
}`)
