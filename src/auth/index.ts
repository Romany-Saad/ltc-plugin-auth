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
    let permissions = user.data.permissions.map((p: any) => {
      return { name: p.data.name, data: {} }
    })
    this.authorizationData.permissions = permissions
    return this.authorizationData.permissions
  }
}
