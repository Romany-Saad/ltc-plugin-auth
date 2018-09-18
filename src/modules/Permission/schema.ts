import { TypeComposer, InputTypeComposer } from "graphql-compose"

TypeComposer.create(`
type Permission {
    id: ID!
    name: String!
}`)

InputTypeComposer.create(`
input NewPermission {
    name: String!

}`)

InputTypeComposer.create(`
input PermissionPatch {
    name: String

}`)

InputTypeComposer.create(`
input PermissionCount {
    name: String
}`)

/*

extend type Query {
    getPermissions: [Permission!]!
    getPermission(id: ID!): [Permission!]!
    countPermissions(input: PermissionCount): Int!
}

extend type Mutation {
    addPermission(input: NewPermission): Permission!
    updatePermission(id: ID!, input: PermissionPatch): Permission!
    deletePermission(id: ID!): Boolean!
}
*/
