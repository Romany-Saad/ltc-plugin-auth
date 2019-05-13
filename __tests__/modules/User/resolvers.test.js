const {graphql} = require('graphql')
const registerPluginsAndInitApp = require('../../mocks/app')
const {rootPath} = require('../../../lib/globals')
const fake = require('./faker')
const names = require('../../../lib/index').names
const {schemaComposer} = require('graphql-compose')
const seeder = require('./seeder')
const permissionSeeder = require('./../Permission/seeder')
const Auth = require('./../../../lib/auth').default

let app, schema, repository, instance, permission, token

beforeAll(async () => {
  app = await registerPluginsAndInitApp()
  schema = schemaComposer.buildSchema()
  repository = app.get(names.AUTH_USERS_REPOSITORY)
  instance = (await seeder(app, 1, '123456sd'))[0]
  permission = (await permissionSeeder(app, 1))[0]
}, 30000)

describe('given schema is the GraphQlSchema object loaded with schemas from User plugin', () => {

  it('should insert a User if data is valid', async () => {
    const data = await fake('123456sd', null)
    const q = `mutation AddUser($data: NewUser!) { addUser (input: $data) { id , email } }`
    const x = await graphql(schema, q, null, null, {data})
    expect(x).toHaveProperty('data.addUser.email')
    expect(x).toHaveProperty('data.addUser.id')
  })

  it('should register a User if data is valid and returns AuthedUser', async () => {
    const data = await fake('123456sd', null)
    data.grecaptchaToken = '03AOLTBLROnueSTTeS6gRKyLLPV0CWW9ke6PRdG6fjLdWUoAK9-ZV2V5ayNBE8bd4KdUe-fBfaHeyDaYt5XzS1xZRgGrZkFihjAzWXrPbgvEQ3kqR91X-m7IV_eo80CaStw35JmzdVkDKKZgPdznvDjHDbJV_k7S0VK8b_ScCfyNIugHrfgbcyn4zNg1tdaKO57jdpo9aZEcjne2MSZg6AXr9J6dLUNWPoaehlegq6XoHfQo5vRwJlFq7NHeJHAkIVEAp48lWN8g_pozmKg1W6-5YUZG8ZYvikVu32rfGKRt-7z0wvogg5uWbVkGMNpdgcQe7scKZwr9Pg'
    const q = `mutation register($data: Register!) { register (input: $data) {
      id,
      name,
      token,
      permissions {name},
      email,
     } }`
    const x = await graphql(schema, q, null, null, {data})
    expect(x).toHaveProperty('data.register.email')
    expect(x).toHaveProperty('data.register.id')
  }, 10000)

  it('should login a User if data is valid and returns AuthedUser', async () => {
    const q = `query login($email: String!, $password: String!) { login (email: $email, password: $password)
     {
      id,
      name,
      token,
      permissions {name},
      email,
     } }`
    const x = await graphql(schema, q, null, null, {email: instance.data.email, password: '123456sd'})
    token = x.data.login.token
    console.log(JSON.stringify(x, null, '\t'))

    expect(x).toHaveProperty('data.login.email')
    expect(x).toHaveProperty('data.login.id')
    expect(typeof x.data.login.permissions[0].name).toBe('string')
  })

  it('should return User data on Mutation.changePassword()', async () => {
    const q = `mutation { changePassword ( id: "${instance.getId()}", oldPassword: "123456sd", newPassword: "654987ds")}`
    const x = await graphql(schema, q)
    expect(x.data.changePassword).toBe(true)
  })
  it('should verify token on checkToken', async () => {
    const q = `query checkToken($token: String!) { checkToken (token: $token)}`
    const x = await graphql(schema, q, null, null, {token})
    expect(x.data.checkToken).toBe(true)
  })

  it('should retrieve authed user data from authentication class', async () => {
    let authed = new Auth(app, `Bearer ${token}`)
    expect(authed.getAuthedUser()).toHaveProperty('userId')
  })

  it('should return User data on Mutation.updateUser()', async () => {
    const q = `mutation { updateUser ( id: "${instance.getId()}", input: {name: "test"}){ id, name }}`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.updateUser.id')
    expect(x).toHaveProperty('data.updateUser.name', 'test')
  })

  it('should return User data on Mutation.changeEmail()', async () => {
    const q = `mutation { changeEmail ( id: "${instance.getId()}", newEmail: "something@example.com")}`
    const x = await graphql(schema, q)
    expect(x.data.changeEmail).toBe(true)
  })

  it('should return a list of roles on getRoles()', async () => {
    const q = `query { getRoles{name} }`
    const x = await graphql(schema, q, app)
    expect(x).toHaveProperty('data.getRoles.0.name')
  })

  it('should return a list of Users on Query.getUsers()', async () => {
    const q = `query { getUsers { id, email } }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.getUsers.0.id')
  })

  it('should return a count of Users on Query.countUsers()', async () => {
    const q = `query { countUsers(filter: {}) }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.countUsers')
  })

  it('should return an instance of Users on Query.getUser()', async () => {
    const q = `query { getUser(id: "${instance.getId()}") { id, email } }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.getUser.id')
  })

  it('should return a boolean on Mutation.deleteUser()', async () => {
    const q = `mutation { deleteUser (id: "${instance.getId()}") }`
    const x = await graphql(schema, q)
    expect(x).toHaveProperty('data.deleteUser', true)
  })
})
