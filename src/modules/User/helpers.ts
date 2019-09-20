import App, { IStringKeyedObject } from '@cyber-crafts/ltc-core'
import { merge } from '../../utils'
import { User, Users } from './index'
import { names } from '../../index'

const { OAuth2Client } = require('google-auth-library')
import jwt = require('jwt-simple')

export const transform = (item: User): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[ item.getIdFieldName() ]
  return obj
}

export const verifyGoogleIdToken = async (app: App, token: string) => {
  const googleAuthConfig = app.config().get('auth.google')
  const client = new OAuth2Client(googleAuthConfig.client_id)
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: googleAuthConfig.client_id,
  })
  return ticket.getPayload()
}

export const getAuthedUser = (app: App, user: any, authData: { authedVia: string, lastAuthenticated: any }) => {
  const authConfig = app.config().get('auth')
  let token = jwt.encode({
    userId: user.getId(),
    authenticatedVia: authData.authedVia || 'api',
    lastAuthenticated: authData.lastAuthenticated || new Date(),
  }, authConfig.secret)
  let permissions = user.get('permissions').map((p: any) => {
    return {
      name: p.name,
      data: p.data,
    }
  })
  const defaultPermissions = authConfig.user.defaultPermissions
  const roles = authConfig.roles
  if (defaultPermissions) {
    permissions.push(...defaultPermissions.map((p: any) => {
      return {
        name: p.name,
        data: p.data,
      }
    }))
  }
  if (user.get('roles')) {
    for (let role of user.get('roles')) {
      let currentRole = roles.find((configRole: any) => configRole.name === role)
      if (currentRole) {
        currentRole.permissions.forEach((p: any) => {
          permissions.push({
            name: p.name,
            data: p.data,
          })
        })
      }
    }
  }
  let authedUser: any = {
    id: user.getId(),
    token: token,
    permissions: permissions,
    email: user.get('email'),
  }
  if (user.get('name')) {
    authedUser.name = user.get('name')
  }
  return authedUser
}


export const loginUser = async (app: App, user: any, loginVia: string, platformData: IStringKeyedObject) => {
  const repository = app.get<Users>(names.AUTH_USERS_REPOSITORY)
  const authenticationDate = new Date()
  let authentication = user.get('authentication')
  if (!authentication) {
    authentication = {
      [ loginVia ]: [ authenticationDate ],
    }
  } else if (authentication[ loginVia ]) {
    authentication[ loginVia ].push(authenticationDate)
  } else {
    authentication[ loginVia ] = [ authenticationDate ]
  }
  const socialMediaData = merge(user.get('socialMediaData'), platformData)
  const data = merge(transform(user), {
    authentication,
    socialMediaData,
  })
  user.set(data)
  if (await repository.update([ user ])) {
    return getAuthedUser(app, user, {
      authedVia: loginVia,
      lastAuthenticated: authenticationDate,
    })
  } else {
    return false
  }
}