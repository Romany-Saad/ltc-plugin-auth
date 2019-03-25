import App, { IStringKeyedObject } from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import { restDefaultAuth } from './helpers'

export const initPermissions = async (app: App, customData: IStringKeyedObject) => {
  const authConfigs = loadAuthConfigs(app)
  const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
  authPlugin.setGraphQlAuthConfig([...authConfigs.graphql, ...customData.authConfigs.graphql])
  authPlugin.setRestAuthConfig([...authConfigs.rest, ...customData.authConfigs.rest])
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
  const graphqlAuthConfigs = [ ...queryAuthConfigs, ...mutationAuthConfigs ]
  return graphqlAuthConfigs
}

function generateGraphqlEndpointsConfig (endpoints: string[], endpointsType: string) {
  const configs = []
  for (let endpoint in endpoints) {
    let data: any = {
      endpoint: endpoint,
      type: endpointsType,
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
