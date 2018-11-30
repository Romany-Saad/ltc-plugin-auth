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

  /*
  it("should insert a Permission if data is valid", async () => {
    const data = fake();
    const q = `mutation AddPermission($data: NewPermission!) { addPermission ( input: $data) { id , name } }`;
    const x = await graphql(schema, q, null, null, { data });
    expect(x).toHaveProperty("data.addPermission.name");
    expect(x).toHaveProperty("data.addPermission.id");
  });*/

  it('should return Permission data on Mutation.enablePermission()', async () => {
    const q = `mutation { enablePermission ( id: "${instance.getId()}"){ id, name, protected }}`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.enablePermission.id')
    expect(x).toHaveProperty('data.enablePermission.protected', true)
  })
  it('should return Permission data on Mutation.disablePermission()', async () => {
    const q = `mutation { disablePermission ( id: "${instance.getId()}"){ id, name, protected }}`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.disablePermission.id')
    expect(x).toHaveProperty('data.disablePermission.protected', false)
  })

  it('should return a list of Permissions on Query.getPermissions()', async () => {
    const q = `query { getPermissions { id, name } }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.getPermissions.0.id')
  })

  it('should return a count of Permissions on Query.countPermissions()', async () => {
    const q = `query { countPermissions(filter: {}) }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.countPermissions')
  })

  it('should return an instance of Permissions on Query.getPermission()', async () => {
    const q = `query { getPermission(id: "${instance.getId()}") { id, name } }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.getPermission.id')
  })

  it('should return a boolean on Mutation.deletePermission()', async () => {
    const q = `mutation { deletePermission (id: "${instance.getId()}") }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.deletePermission', true)
  })
})
