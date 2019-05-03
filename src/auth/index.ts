import jwt = require('jwt-simple')
import IStringKeyedObject from '@lattice/core/lib/contracts/IStringKeyedObject'
import App from '@lattice/core'
import { names } from '../index'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'

export default class Auth {
  protected authorizationData: IStringKeyedObject
  protected app: App

  constructor (container: App, authorizaionHeader: string) {
    this.app = container
    this.authorizationData = jwt.decode(this.getTokenFromHeader(authorizaionHeader), container.config().get('auth').secret)
  }

  getTokenFromHeader (token: string) {
    return token.match(/Bearer (.+)/)[ 1 ]
  }

  getAuthedUser () {
    return this.authorizationData
  }

  async initUserPermissions () {
    const userRepo = this.app.get<AMongoDbRepository<any>>(names.AUTH_USERS_REPOSITORY)
    let user = (await userRepo.findByIds([ this.authorizationData.userId ]))[ 0 ]
    if (!user) {
      throw new Error('Invalid token')
    }

    let permissions = user.data.permissions.map((p: any) => {
      return {
        name: p.name,
        description: '',
      }
    })
    const authConfig = this.app.config().get('auth')
    const defaultPermissions = authConfig.user.defaultPermissions
    const roles = authConfig.roles
    if (defaultPermissions) {
      permissions.push(...defaultPermissions.map((p: any) => {
        return {
          name: p.name,
          description: '',
        }
      }))
    }
    for (let role of user.get('roles')) {
      let currentRole = roles.find((configRole: any) => configRole.name === role)
      if (currentRole) {
        permissions.push({
          name: currentRole.name,
          description: '',
        })
      }
    }
    this.authorizationData.permissions = permissions
    return this.authorizationData.permissions
  }
}
