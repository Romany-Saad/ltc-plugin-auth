import App, { contracts } from "@lattice/core"
import { IConfiguration } from "@lattice/core/lib/contracts"
import resolvers from "./schema/resolvers"
import Connection from "ltc-plugin-mongo/lib/Connection"
import { namer } from "@lattice/core/lib/utils"
import { names as mongoNames } from "ltc-plugin-mongo"
import { Context } from "c2v"
import { Permissions } from "./modules/Permission"
import { Users } from "./modules/User"


export const names = {
    AUTH_PERMISSIONS_REPOSITORY: Symbol(namer.resolve("auth", "permissions", "repository")),
    AUTH_USERS_REPOSITORY: Symbol(namer.resolve("auth", "users", "repository")),
}

export default class implements contracts.IPlugin {

  name: string = "cyber-crafts.cms-plugin-auth"
  private resolvers: object

  constructor () {

  }

  /*
  * used to provide access to the App container to register
  * the plugin's services and resources
  * */
  async load (container: App): Promise<void> {
    const config: IConfiguration = container.config()
    const connection: Connection = container.get(mongoNames.MONGO_SERVICES_CONNECTION)

    const permissions = new Permissions(connection.getClient(), `permissions`)
    container.bind<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY).toConstantValue(permissions)
    Context.bind(names.AUTH_PERMISSIONS_REPOSITORY, permissions)

    const users = new Users(connection.getClient(), `users`)
    container.bind<Users>(names.AUTH_USERS_REPOSITORY).toConstantValue(users)
    Context.bind(names.AUTH_USERS_REPOSITORY, users)

    resolvers(container)

  }

}