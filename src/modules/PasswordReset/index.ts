export { default as PasswordReset } from './model'
export { default as PasswordResets } from './repository'
export { default as resolvers } from './resolvers'

/*
// adding the repository to the container ./src/index.ts
import { PasswordReset, PasswordResets } from "./modules/Test"

container.bind<PasswordReset>(`${this.name}.repository.PasswordResets`)
  .toConstantValue(new PasswordResets(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/PasswordReset/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as PasswordResetResolvers } from "../modules/PasswordReset"
then merge it with other resolvers
*/
