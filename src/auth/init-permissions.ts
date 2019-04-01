import App, { IStringKeyedObject } from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import { graphQlDefaultAuth, restDefaultAuth } from './helpers'
import IGraphqlAuthConfig from '../contracts/IGraphqlAuthConfig'
import ICustomAuthData from '../contracts/ICustomAuthData'

export const initPermissions = async (app: App, customData: ICustomAuthData) => {
  const authConfigs = loadAuthConfigs(app)
  const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
  authPlugin.setGraphQlAuthConfig(resolveGraphQlConflicts(authConfigs.graphql, customData.authConfigs.graphql))
  authPlugin.setRestAuthConfig(resolveRestConflicts(authConfigs.rest, customData.authConfigs.rest))
  authPlugin.setAvailablePermissions(customData.permissions)
  app.emitter.emit('PERMISSIONS_INIT_DONE', authPlugin.availablePermissions)
}

function loadAuthConfigs (app: App) {
  const graphqlAuthConfigs = getGraphQlAuthConfigs()
  const restEndpoints = getAvailableRoutes(app)
  const restAuthConfigs = restEndpoints.map((endpoint: IStringKeyedObject) => {
    endpoint.authorize = restDefaultAuth(endpoint.path)
    return endpoint
  })
  return {
    graphql: graphqlAuthConfigs,
    rest: restAuthConfigs,
  }
}

function getGraphQlAuthConfigs () {
  let queryEndpoints: any = schemaComposer.rootQuery().getFields()
  let mutationEndpoints: any = schemaComposer.rootMutation().getFields()
  const queryAuthConfigs = generateGraphqlEndpointsConfig(queryEndpoints, 'query')
  const mutationAuthConfigs = generateGraphqlEndpointsConfig(mutationEndpoints, 'mutation')
  return [ ...queryAuthConfigs, ...mutationAuthConfigs ]
}

function generateGraphqlEndpointsConfig (endpoints: string[], endpointsType: string) {
  const configs = []
  for (let endpoint in endpoints) {
    let data: IGraphqlAuthConfig = {
      endpoint: endpoint,
      type: endpointsType,
      authorize: graphQlDefaultAuth,
    }
    configs.push(data)
  }
  return configs
}

function getAvailableRoutes (app: App) {
  return app.express._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => {
      return {
        method: Object.keys(r.route.methods)[ 0 ].toUpperCase(),
        path: r.route.path,
      }
    })
}

function resolveGraphQlConflicts (defaultData: any[], customData: any[]) {
  defaultData = defaultData.map((config) => {
    const currentCustom = customData.find(customConfig => {
      return customConfig.endpoint === config.endpoint
    })
    if (currentCustom != undefined) {
      config.authorize = currentCustom.authorize
    }
    return config
  })
  return defaultData
}

function resolveRestConflicts (defaultData: any[], customData: any[]) {
  defaultData = defaultData.map((config) => {
    const currentCustom = customData.find(customConfig => {
      return (customConfig.path === config.path) && (customConfig.method === config.method)
    })
    if (currentCustom != undefined) {
      config.authorize = currentCustom.authorize
    }
    return config
  })
  return defaultData
}
