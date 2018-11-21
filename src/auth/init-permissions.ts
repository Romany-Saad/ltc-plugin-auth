import App from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { names } from '../index'

export const initPermissions = async (app: App) => {
  // get existing endpoints in database
  const permissionsRepo = app.get<AMongoDbRepository<any>>(names.AUTH_PERMISSIONS_REPOSITORY)
  const databasesPermissions = await permissionsRepo.find({})
  let databaseEndpoints = databasesPermissions.map(permission => {
    return permission.data.endpoint
  })
  // get all endpoints from plugins
  let queryEndpoints = schemaComposer.rootQuery().getFields()
  let mutationEndpoints = schemaComposer.rootMutation().getFields()
  let subscriptionEndpoints = schemaComposer.rootSubscription().getFields()
  // get all the endpoints that doesn't exist in db
  let newEndpoints = []
  for (let endpoint in queryEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'query',
      }))
    }
  }
  for (let endpoint in mutationEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'mutation',
      }))
    }
  }
  for (let endpoint in subscriptionEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'subscription',
      }))
    }
  }
  if (newEndpoints.length) {
    permissionsRepo.insert(newEndpoints)
      .catch(err => {
        throw new Error(err)
      })
  }
}