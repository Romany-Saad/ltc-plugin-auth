const { graphql } = require("graphql");
const registerPluginsAndInitApp = require("../../mocks/app");
const { rootPath } = require("../../../lib/globals");
const fake = require("./faker");
const names = require("../../../lib/index").names;
const { schemaComposer } = require('graphql-compose');
const seeder = require('./seeder');
const permissionSeeder = require('./../Permission/seeder');
const Auth = require('./../../../lib/auth').default;

let app, schema, repository, instance, permission, token;

beforeAll(async () => {
  app = await registerPluginsAndInitApp();
  schema = schemaComposer.buildSchema();
  repository = app.get(names.AUTH_USERS_REPOSITORY);
  instance = (await seeder(app, 1, '123456sd'))[0];
  permission = (await permissionSeeder(app, 1))[0];
});

describe("given schema is the GraphQlSchema object loaded with schemas from User plugin", () => {

  it("should insert a User if data is valid", async () => {
    const data = await fake('123456sd', null);
    const q = `mutation AddUser($data: NewUser!) { addUser (input: $data) { id , email } }`;
    const x = await graphql(schema, q, null, null, {data});
    expect(x).toHaveProperty("data.addUser.email");
    expect(x).toHaveProperty("data.addUser.id");
  });

  it("should register a User if data is valid and returns AuthedUser", async () => {
    const data = await fake('123456sd', null);
    const q = `mutation register($data: NewUser!) { register (input: $data) { id , email, permissions } }`;
    const x = await graphql(schema, q, null, null, {data});
    expect(x).toHaveProperty("data.register.email");
    expect(x).toHaveProperty("data.register.id");
  });

    it("should login a User if data is valid and returns AuthedUser", async () => {
        const q = `query login($email: String!, $password: String!) { login (email: $email, password: $password) { id , email, permissions, token } }`;
        const x = await graphql(schema, q, null, null, {email: instance.data.email, password: '123456sd'});
        token = x.data.login.token
        expect(x).toHaveProperty("data.login.email");
        expect(x).toHaveProperty("data.login.id");
    });

    it("should retrieve authed user data from authentication class", async () => {
        let authed = new Auth(app, `Bearer ${token}`);
        expect(authed.getAuthedUser()).toHaveProperty("userId");
    });

  it("should return User data on Mutation.updateUser()", async () => {
    const q = `mutation { updateUser ( id: "${instance.getId()}", input: {name: "test"}){ id, name }}`;
    const x = await graphql(schema, q);
    expect(x).toHaveProperty("data.updateUser.id");
    expect(x).toHaveProperty("data.updateUser.name", "test");
  });

  it("should return User data on Mutation.changeEmail()", async () => {
    const q = `mutation { changeEmail ( id: "${instance.getId()}", newEmail: "something@example.com")}`;
    const x = await graphql(schema, q);
    expect(x.data.changeEmail).toBe(true);
  });

  it("should return User data on Mutation.changePassword()", async () => {
    const q = `mutation { changePassword ( id: "${instance.getId()}", newPassword: "654987ds")}`;
    const x = await graphql(schema, q);
    expect(x.data.changePassword).toBe(true);
  });

  it("should return a list of Users on Query.getUsers()", async () => {
    const q = `query { getUsers { id, email } }`;
    const x = await graphql(schema, q);
    expect(x).toHaveProperty("data.getUsers.0.id");
  });

  it("should return a count of Users on Query.countUsers()", async () => {
      const q = `query { countUsers(filter: {}) }`;
      const x = await graphql(schema, q);
      expect(x).toHaveProperty("data.countUsers");
  });

  it("should return an instance of Users on Query.getUser()", async () => {
      const q = `query { getUser(id: "${instance.getId()}") { id, email } }`;
      const x = await graphql(schema, q);
      expect(x).toHaveProperty("data.getUser.id");
  });

  it("should return a boolean on Mutation.deleteUser()", async () => {
    const q = `mutation { deleteUser (id: "${instance.getId()}") }`;
    const x = await graphql(schema, q);
    expect(x).toHaveProperty("data.deleteUser", true);
  });
});
