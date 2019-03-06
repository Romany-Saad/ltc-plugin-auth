const {graphql} = require('graphql')
const registerPluginsAndInitApp = require('../../mocks/app')
const {rootPath} = require('../../../lib/globals')
const fake = require('./faker')
const names = require('../../../lib/index').names
const {schemaComposer} = require('graphql-compose')
const userSeeder = require('./../User/seeder')
const mongo = require('mongodb')

let app, schema, repository, user

beforeAll(async () => {
  app = await registerPluginsAndInitApp()
  schema = schemaComposer.buildSchema()
  repository = app.get(names.AUTH_PASSWORD_RESET_REPOSITORY)
  user = (await userSeeder(app, 1, '123456sd', 'habib@cyber-crafts.com'))[0]
})

function getConnection() {
// Connection url
  const url = 'mongodb://localhost:27017'
// Connect using MongoClient
  try {
    return mongo.MongoClient.connect(url)
  } catch (e) {
    console.log(e)
  }
}

describe('given schema is the GraphQlSchema object loaded with schemas from PasswordReset plugin', () => {

  it('should insert a PasswordReset if data is valid', async () => {
    // const data = fake(user)
    const email = user.data.email
    console.log(user.get('email'))
    const q = `mutation resetPassword($email: String!) { resetPassword ( email: $email)}`
    const x = await graphql(schema, q, null, null, {email})
    expect(x.data.resetPassword).toBe(true)
  })
  it('should verify a PasswordReset if data is valid', async () => {
    // const data = fake(user)
    //   console.log(getConnection())
    // console.log('here')
    let con = await getConnection()
    let db = con.db('__testing__cyber-crafts_cms-plugin-auth')
    let resetsCollection = db.collection('passwordResets')
    let reset = (await resetsCollection.find({}).toArray())[0]
    // console.log(reset)
    let id = reset._id
    let code = reset.secretCode
    let password = '12345699sd'
    const q = `mutation verifyResetPassword($id: ID!, $code: String!, $password: String!)
            { verifyResetPassword( id: $id, code: $code, password: $password)}`
    // console.log(reset)
    // console.log(id, code, password)
    const x = await graphql(schema, q, null, null, {id, code, password})
    expect(x.data.verifyResetPassword).toBe(true)
  })
  /*
    it("should return PasswordReset data on Mutation.updatePasswordReset()", async () => {
      const q = `mutation { updatePasswordReset ( id: "${instance.getId()}", input: { name: "test" }){ id, name }}`;
      const x = await graphql(schema, q);
      expect(x).toHaveProperty("data.updatePasswordReset.id");
      expect(x).toHaveProperty("data.updatePasswordReset.name", "test");
    });

    it("should return a list of PasswordResets on Query.getPasswordResets()", async () => {
      const q = `query { getPasswordResets { id, name } }`;
      const x = await graphql(schema, q);
      expect(x).toHaveProperty("data.getPasswordResets.0.id");
    });

    it("should return a count of PasswordResets on Query.countPasswordResets()", async () => {
        const q = `query { countPasswordResets(filter: {}) }`;
        const x = await graphql(schema, q);
        expect(x).toHaveProperty("data.countPasswordResets");
    });

    it("should return an instance of PasswordResets on Query.getPasswordReset()", async () => {
        const q = `query { getPasswordReset(id: "${instance.getId()}") { id, name } }`;
        const x = await graphql(schema, q);
        expect(x).toHaveProperty("data.getPasswordReset.id");
    });

    it("should return a boolean on Mutation.deletePasswordReset()", async () => {
      const q = `mutation { deletePasswordReset (id: "${instance.getId()}") }`;
      const x = await graphql(schema, q);
      expect(x).toHaveProperty("data.deletePasswordReset", true);
    });*/
})
