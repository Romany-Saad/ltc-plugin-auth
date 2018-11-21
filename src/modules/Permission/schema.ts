import { TypeComposer, InputTypeComposer } from 'graphql-compose'

export const PermissionTC = TypeComposer.create(`
type Permission {
    id: ID!
    name: String!
    endpoint: String!
    protected: Boolean!
    type: String!
}`)
/*

InputTypeComposer.create(`
input NewPermission {
    name: String!
    endpoint: String!
    protected: Boolean!
}`)

InputTypeComposer.create(`
input PermissionPatch {
    name: String
    endpoint: String
    protected: Boolean
}`)
*/

InputTypeComposer.create(`
input PermissionCount {
    type: String
    name: String
    endpoint: String
    protected: Boolean
}`)
