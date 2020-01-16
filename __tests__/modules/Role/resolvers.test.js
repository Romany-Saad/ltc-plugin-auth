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
  repository = app.get(names.AUTH_ROLES_REPOSITORY)
  instance = (await seeder(app, 1))[0]
})

describe('given schema is the GraphQlSchema object loaded with schemas from Role plugin', () => {

  it('should insert a Role if data is valid', async () => {
    const data = fake()
    const q = `mutation AddRole($data: NewRole!) { addRole ( input: $data) { id , name } }`
    const x = await graphql(schema, q, app, null, {data})
    expect(x).toHaveProperty('data.addRole.name')
    expect(x).toHaveProperty('data.addRole.id')
  })

  it('should return Role data on Mutation.updateRole()', async () => {
    const q = `mutation { updateRole ( id: "${instance.getId()}", input: { name: "test" }){ id, name }}`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.updateRole.id')
    expect(x).toHaveProperty('data.updateRole.name', 'test')
  })

  it('should return a list of Roles on Query.getRoles()', async () => {
    const q = `query { getRoles {  items{id, name}, totalCount, configRoles {name} } }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.getRoles.items.0.id')
    expect(x).toHaveProperty('data.getRoles.totalCount')
    expect(x).toHaveProperty('data.getRoles.configRoles.0.name')
  })

  it('should return an instance of Roles on Query.getRole()', async () => {
    const q = `query { getRole(id: "${instance.getId()}") { id, name } }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.getRole.id')
  })

  it('should return a boolean on Mutation.deleteRole()', async () => {
    const q = `mutation { deleteRole (id: "${instance.getId()}") }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.deleteRole', true)
  })
})
