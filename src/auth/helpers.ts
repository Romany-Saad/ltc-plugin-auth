import App, { IStringKeyedObject } from '@lattice/core'

//TODO: figure out the logic for these 2

export const graphQlDefaultAuth = (next: any) => (rp: any) => {
  return next(rp)
}

export const restDefaultAuth = (req: any, res: any, next: any) => {
  next()
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