import { InputTypeComposer, ObjectTypeComposer, schemaComposer } from 'graphql-compose'

ObjectTypeComposer.create(`
type PasswordReset {
    id: ID!
    userId: ID!
    secretCode: String!
    createdAt: Date!
    state: String!
}`, schemaComposer)

InputTypeComposer.create(`
input PasswordResetCount {
    userId: ID
    secretCode: String
    createdAt: Date
    state: String
}`, schemaComposer)
