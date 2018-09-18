export {default as Permission} from "./model"
export {default as Permissions} from "./repository"
export {default as resolvers} from "./resolvers"

/*
// adding the repository to the container ./src/index.ts
import { Permission, Permissions } from "./modules/Test"

container.bind<Permission>(`${this.name}.repository.Permissions`)
  .toConstantValue(new Permissions(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/Permission/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as PermissionResolvers } from "../modules/Permission"
then merge it with other resolvers
*/
