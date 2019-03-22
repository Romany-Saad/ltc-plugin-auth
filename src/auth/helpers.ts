import App, { IStringKeyedObject } from '@lattice/core'

export const graphQlDefaultAuth = (next: any) => (rp: any) => {
  // get the endpoint
  const endpoint = 'something'
  // check if user permissions has endpoint
  if (rp.context.user && rp.context.user.permissions.find((p: any) => p.name === endpoint) != undefined) {
    return next(rp)
  }
  else {
    throw new Error('permissions denied')
  }
}

export const restDefaultAuth = (req: any, res: any, next: any) => {
  const endpoint = req.url
  if (req.user && req.user.permissions.find((p: any) => p.name === endpoint) != undefined) {
    next()
  }
  else {
    throw new Error('permissions denied')
  }
}


export const getEndpointAuthConfig = (app: App, endpoint: string, httpMethod: string) => {
  const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
  const authConfigs = authPlugin.authConfig
  const g = endpoint.match(/\/graphql.*/g)
  if (g === null) {
    const endpointAuthConfig = authConfigs.rest.find((config: IStringKeyedObject)=> {
      return config.endpoint === endpoint
    })
    return endpointAuthConfig === undefined? null: endpointAuthConfig
  }
  return true
}