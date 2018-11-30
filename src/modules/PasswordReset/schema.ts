import { InputTypeComposer, TypeComposer } from 'graphql-compose'

TypeComposer.create(`
type PasswordReset {
    id: ID!
    userId: ID!
    secretCode: String!
    createdAt: Date!
    state: String!
}`)
/*

InputTypeComposer.create(`
input NewPasswordReset {
    userId: ID!
    secretCode: String!
    createdAt: Date!
    state: String!
}`)

InputTypeComposer.create(`
input PasswordResetPatch {
    userId: ID
    secretCode: String
    createdAt: Date
    state: String
}`)

*/
InputTypeComposer.create(`
input PasswordResetCount {
    userId: ID
    secretCode: String
    createdAt: Date
    state: String
}`)

/*

extend type Query {
    getPasswordResets: [PasswordReset!]!
    getPasswordReset(id: ID!): [PasswordReset!]!
    countPasswordResets(input: PasswordResetCount): Int!
}

extend type Mutation {
    addPasswordReset(input: NewPasswordReset): PasswordReset!
    updatePasswordReset(id: ID!, input: PasswordResetPatch): PasswordReset!
    deletePasswordReset(id: ID!): Boolean!
}
*/
