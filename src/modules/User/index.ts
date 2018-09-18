export {default as User} from "./model"
export {default as Users} from "./repository"
export {default as resolvers} from "./resolvers"

/*
// adding the repository to the container ./src/index.ts
import { User, Users } from "./modules/Test"

container.bind<User>(`${this.name}.repository.Users`)
  .toConstantValue(new Users(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/User/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as UserResolvers } from "../modules/User"
then merge it with other resolvers
*/
