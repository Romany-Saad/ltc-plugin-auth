import App, { IStringKeyedObject } from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { names } from '../index'
import { names as mailNames } from 'ltc-plugin-mail'
import bcrypt = require('bcrypt')
import { graphQlDefaultAuth, restDefaultAuth } from './helpers'

export const initPermissions = async (app: App, unprotectedEndpoints: string[] = [], customPermissions: IStringKeyedObject[]) => {
  // get auth configs
  const authConfigs = loadAuthConfigs(app, unprotectedEndpoints)
  // store them on plugin
  const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
  authPlugin.setGraphQlAuthConfig(authConfigs.graphql)
  authPlugin.setRestAuthConfig(authConfigs.rest)
  authPlugin.setAvailablePermissions(customPermissions)
  // repository declarations
  // store them on plugin
  // repository declarations
  const userRepo = app.get<AMongoDbRepository<any>>(names.AUTH_USERS_REPOSITORY)

  // check if any of the customPermissions isn't in permissions
//  TODO: set the admin creation / update part in an event that would be handled by user listener

  app.emitter.emit('PERMISSIONS_INIT_DONE', authPlugin.availablePermissions)

}

function loadAuthConfigs (app: App, unprotectedEndpoints: string[]) {
  const graphqlAuthConfigs = getGraphQlAuthConfigs()
  const restEndpoints = getAvailableRoutes(app)
  const restAuthConfigs = restEndpoints.map((endpoint: IStringKeyedObject)=> {
    endpoint.authorize = restDefaultAuth
    return endpoint
  })
  return {
    graphql : graphqlAuthConfigs,
    rest : restAuthConfigs,
  }
}

function getGraphQlAuthConfigs () {
  let queryEndpoints = schemaComposer.rootQuery().getFields()
  let mutationEndpoints = schemaComposer.rootMutation().getFields()
  const graphqlAuthConfigs = []
  for (let endpoint in queryEndpoints) {
    let data = {
      endpoint: endpoint,
      name: endpoint,
      protected: true,
      type: 'query',
      authorize: graphQlDefaultAuth
    }
    /*if (unprotectedEndpoints.indexOf(endpoint) > -1) {
      data.protected = false
    }*/
    graphqlAuthConfigs.push(data)
  }
  for (let endpoint in mutationEndpoints) {
    let data = {
      endpoint: endpoint,
      name: endpoint,
      protected: true,
      type: 'mutation',
      authorize: graphQlDefaultAuth
    }
    /*if (unprotectedEndpoints.indexOf(endpoint) > -1) {
      data.protected = false
    }*/
    graphqlAuthConfigs.push(data)
  }
  return graphqlAuthConfigs
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
