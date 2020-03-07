import App, { IStringKeyedObject } from '@cyber-crafts/ltc-core'

const UrlPattern = require('url-pattern')

export const graphQlDefaultAuth = (next: any) => (obj: any, args: any, context: any, info: any) => {

  const endpoint = info.fieldName

  // check if user permissions has endpoint
  if (context.user && context.user.permissions.find((p: any) => p.name === endpoint) != undefined) {
    return next(obj, args, context, info)
  } else {
    throw new Error('permissions denied')
  }
}

export const graphQlDefaultUnprotectedAuth = (next: any) => (obj: any, args: any, context: any, info: any) => {
  return next(obj, args, context, info)
}

export const restDefaultAuth = (route: string) => (req: any, res: any, next: any) => {
  if (req.user && req.user.permissions.find((p: any) => p.name === route) != undefined) {
    next()
  } else {
    throw new Error('permissions denied')
  }
}

export const restDefaultUnprotectedAuth = (route: string) => (req: any, res: any, next: any) => {
  next()
}

export const getEndpointAuthConfig = (app: App, endpoint: string, httpMethod: string) => {
  const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
  const authConfigs = authPlugin.authConfig
  const graphqlMatch = endpoint.match(/\/graphql.*/g)
  if (graphqlMatch === null) {
    const endpointAuthConfig = authConfigs.rest.find((config: IStringKeyedObject) => {
      const pattern = new UrlPattern(config.path, {
        segmentValueCharset: 'a-zA-Z0-9-_~ %\.',
      })
      const trimmedEndpoint = endpoint.split('?')[ 0 ]
      return pattern.match(trimmedEndpoint) && (config.method === httpMethod)
    })
    return endpointAuthConfig === undefined ? null : endpointAuthConfig
  }
  return true
}
