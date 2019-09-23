import App, { contracts, IStringKeyedObject, names as coreNames } from '@cyber-crafts/ltc-core'
import { IConfiguration } from '@cyber-crafts/ltc-core/lib/contracts'
import resolvers from './schema/resolvers'
import Connection from 'ltc-plugin-mongo/lib/Connection'
import { namer } from '@cyber-crafts/ltc-core/lib/utils'
import { names as mongoNames } from 'ltc-plugin-mongo'
import { Context } from 'c2v'
// import { Permissions } from './modules/Permission'
import { Users } from './modules/User'
import { PasswordResets } from './modules/PasswordReset'
import { initPermissions } from './auth/init-permissions'
import userListener from './modules/User/listener'
import ICustomAuthData from './contracts/ICustomAuthData'
import IPermission from './contracts/IPermission'
import IRestAuthConfig from './contracts/IRestAuthConfig'
import IGraphqlAuthConfig from './contracts/IGraphqlAuthConfig'
import { auth } from 'google-auth-library'
import { initializeSocialMediaLoginPlatforms, socialMediaLogin } from './utils'
import passport = require('passport')

const expressSession = require('express-session')


export const names = {
  // AUTH_PERMISSIONS_REPOSITORY: Symbol(namer.resolve('auth', 'permissions', 'repository')),
  AUTH_PERMISSIONS_GRAPHQL_CONFIG: Symbol(namer.resolve('auth', 'permissions', 'config')),
  AUTH_USERS_REPOSITORY: Symbol(namer.resolve('auth', 'users', 'repository')),
  AUTH_PASSWORD_RESET_REPOSITORY: Symbol(namer.resolve('auth', 'passwordResets', 'repository')),
}

export default class implements contracts.IPlugin {

  name: string = 'cyber-crafts.cms-plugin-auth'
  public authConfig: IStringKeyedObject = {}
  public availablePermissions: IPermission[]
  private resolvers: object
  private customData: ICustomAuthData

  constructor (customData: ICustomAuthData) {
    this.customData = customData
  }

  /*
  * used to provide access to the App container to register
  * the plugin's services and resources
  * */
  async load (container: App): Promise<void> {
    const config: IConfiguration = container.config()
    const connection: Connection = container.get(mongoNames.MONGO_SERVICES_CONNECTION)
    container.emitter.on(coreNames.EV_PLUGINS_LOADING, async (items) => {
      container.express.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
      container.express.use(passport.initialize())
    })
    initializeSocialMediaLoginPlatforms(container)

    // const permissions = new Permissions(connection.getClient(), `permissions`)
    // container.bind<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY).toConstantValue(permissions)
    // Context.bind(names.AUTH_PERMISSIONS_REPOSITORY, permissions)

    const users = new Users(connection.getClient(), `users`)
    container.bind<Users>(names.AUTH_USERS_REPOSITORY).toConstantValue(users)
    Context.bind(names.AUTH_USERS_REPOSITORY, users)

    const passwordResets = new PasswordResets(connection.getClient(), `passwordResets`)
    container.bind<PasswordResets>(names.AUTH_PASSWORD_RESET_REPOSITORY).toConstantValue(passwordResets)
    Context.bind(names.AUTH_PASSWORD_RESET_REPOSITORY, passwordResets)

    resolvers(container)

    container.emitter.on(coreNames.EV_PLUGINS_LOADED, async (items: any) => {
      initPermissions(container, this.customData)
        .then(() => {
          console.log('init permissions done')
          this.setAvailablePermissions(this.customData.permissions)
          container.emitter.emit('PERMISSIONS_INIT_DONE')
        })
        .catch(err => {
          throw new Error(err)
        })
    })

    userListener(container)

    container.express.get('/twitter/oauth', passport.authenticate('twitter'))

    container.express.get('/facebook/oauth', passport.authenticate('facebook'))

    container.express.get('/google/oauth',
      passport.authenticate('google', { scope: 'profile email' }))
    // passport.authenticate('google', {scope: 'openid,profile,email'}))

    container.express.get('/oauth/callback',
      (req, res, next) => {
        if (req.query.platform === 'twitter') {
          passport.authenticate('twitter')(req, res, next)
        } else if (req.query.platform === 'google') {
          passport.authenticate('google', { scope: 'profile email' })(req, res, next)
        } else if (req.query.platform === 'facebook') {
          passport.authenticate('facebook')(req, res, next)
        } else {
          res.status(400)
          res.json({
            status: 'fail',
            msg: 'Invalid platform.',
          })
        }
      },
      (req, res, next) => {
        return socialMediaLogin(container, req.query.platform, req.user)
          .then(data => {
            if (data.success) {
              return res.json(data.payload)
            } else {
              return next(data.msg)
            }
          })
          .catch(e => res.sendStatus(500))
      },
    )
  }

  setGraphQlAuthConfig (configs: IGraphqlAuthConfig[]) {
    this.authConfig.graphQl = configs
  }

  setRestAuthConfig (configs: IRestAuthConfig[]) {
    this.authConfig.rest = configs
  }

  setAvailablePermissions (customPermissions: IPermission[] = null) {
    this.availablePermissions = []
    this.availablePermissions.push(...this.authConfig.rest.map((config: any) => {
      return { name: config.path, description: '' }
    }))
    this.availablePermissions.push(...this.authConfig.graphQl.map((config: any) => {
      return { name: config.endpoint, description: '' }
    }))
    if (customPermissions) {
      this.availablePermissions.push(...customPermissions)
    }
  }
}
