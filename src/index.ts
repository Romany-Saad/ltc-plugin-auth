import App, { contracts, IStringKeyedObject, names as coreNames } from '@lattice/core'
import { IConfiguration } from '@lattice/core/lib/contracts'
import resolvers from './schema/resolvers'
import Connection from 'ltc-plugin-mongo/lib/Connection'
import { namer } from '@lattice/core/lib/utils'
import { names as mongoNames } from 'ltc-plugin-mongo'
import { Context } from 'c2v'
import { Permissions } from './modules/Permission'
import { Users } from './modules/User'
import { PasswordResets } from './modules/PasswordReset'
import { initPermissions } from './auth/init-permissions'
import userListener from './modules/User/listener'

export const names = {
  AUTH_PERMISSIONS_REPOSITORY: Symbol(namer.resolve('auth', 'permissions', 'repository')),
  AUTH_PERMISSIONS_GRAPHQL_CONFIG: Symbol(namer.resolve('auth', 'permissions', 'config')),
  AUTH_USERS_REPOSITORY: Symbol(namer.resolve('auth', 'users', 'repository')),
  AUTH_PASSWORD_RESET_REPOSITORY: Symbol(namer.resolve('auth', 'passwordResets', 'repository')),
}

export default class implements contracts.IPlugin {

  name: string = 'cyber-crafts.cms-plugin-auth'
  private resolvers: object
  private unprotectedEndpoints: string[]
  private customPermissions: IStringKeyedObject[]
  public authConfig: IStringKeyedObject = {}
  public availablePermissions: IStringKeyedObject[]

  constructor (unprotectedEndpoints: string[] = [], customPermissions: IStringKeyedObject[]) {
    this.unprotectedEndpoints = unprotectedEndpoints
    this.customPermissions = customPermissions
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

    const passwordResets = new PasswordResets(connection.getClient(), `passwordResets`)
    container.bind<PasswordResets>(names.AUTH_PASSWORD_RESET_REPOSITORY).toConstantValue(passwordResets)
    Context.bind(names.AUTH_PASSWORD_RESET_REPOSITORY, passwordResets)

    resolvers(container)

    container.emitter.on(coreNames.EV_PLUGINS_LOADED, async (items: any) => {
      initPermissions(container, this.unprotectedEndpoints, this.customPermissions)
        .then(() => console.log('init permissions done'))
        .catch(err => {
          throw new Error(err)
        })
    })

    userListener(container)
  }

  setGraphQlAuthConfig (config: IStringKeyedObject[]) {
    this.authConfig.graphQl = config
  }

  setRestAuthConfig (config: IStringKeyedObject[]) {
    this.authConfig.rest = config
  }

  setAvailablePermissions (customPermissions: IStringKeyedObject[] = null) {
    this.availablePermissions = []
    this.availablePermissions.push(...this.authConfig.rest.map((config: any) => {
      return { name: config.endpoint, description: '' }
    }))
    this.availablePermissions.push(...this.authConfig.graphQl.map((config: any) => {
      return { name: config.endpoint, description: '' }
    }))
    if (customPermissions) {
      this.availablePermissions.push(...customPermissions.map((config: any) => {
        return { name: config.endpoint, description: config.description }
      }))
    }
  }
}

// TODO: auth needs general testing
