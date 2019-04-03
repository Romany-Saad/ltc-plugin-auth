const {graphql} = require('graphql')
const registerPluginsAndInitApp = require('../../mocks/app')
const {rootPath} = require('../../../lib/globals')
const fake = require('./faker')
const names = require('../../../lib/index').names
const {schemaComposer} = require('graphql-compose')
const seeder = require('./seeder')

let app, schema, repository, instance

beforeAll(async () => {
  app = await registerPluginsAndInitApp()
  schema = schemaComposer.buildSchema()
  repository = app.get(names.AUTH_PERMISSIONS_REPOSITORY)
  instance = (await seeder(app, 1))[0]

})

describe('given schema is the GraphQlSchema object loaded with schemas from Permission plugin', () => {

  it('should return a list of Permissions on Query.getPermissions()', async () => {
    const q = `query { getPermissions { name } }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.getPermissions.0.name')
  })

  it('should return a count of Permissions on Query.countPermissions()', async () => {
    const q = `query { countPermissions(filter: {}) }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.countPermissions')
  })

})
