import { InputTypeComposer, ObjectTypeComposer, schemaComposer } from 'graphql-compose'

export const PermissionTC = ObjectTypeComposer.create(`
type Permission {
    name: String!
    endpoint: String!
    protected: Boolean!
    type: String!
}`, schemaComposer)
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
}`, schemaComposer)
