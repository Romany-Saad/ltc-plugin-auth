const { graphql } = require("graphql");
const registerPluginsAndInitApp = require("../../mocks/app");
const { rootPath } = require("../../../lib/globals");
const fake = require("./faker");
const names = require("../../../lib/index").names;
const { schemaComposer } = require('graphql-compose');
const seeder = require('./seeder');
const permissionSeeder = require('./../Permission/seeder');

let app, schema, repository, instance, permission;

beforeAll(async () => {
  app = await registerPluginsAndInitApp();
  schema = schemaComposer.buildSchema();
  repository = app.get(names.AUTH_USERS_REPOSITORY);
  instance = (await seeder(app, 1, '123456sd'))[0];
  permission = (await permissionSeeder(app, 1))[0];
});

describe("given schema is the GraphQlSchema object loaded with schemas from User plugin", () => {

  it("should insert a User if data is valid", async () => {
    const data = fake('123456sd');
    const q = `mutation AddUser($email: String!, $password: String!) { addUser ( email: $email, password: $password) { id , email } }`;
    const x = await graphql(schema, q, null, null, data);
    expect(x).toHaveProperty("data.addUser.email");
    expect(x).toHaveProperty("data.addUser.id");
  });

 /* it("should return User data on Mutation.updateUser()", async () => {
    const q = `mutation { updateUser ( id: "${instance.getId()}", input: { email: "test@exampmle.com" }){ id, email }}`;
    const x = await graphql(schema, q);
    expect(x).toHaveProperty("data.updateUser.id");
    expect(x).toHaveProperty("data.updateUser.email", "test@exampmle.com");
  });
*/
  it("should return User data on Mutation.changePermissions()", async () => {
    const q = `mutation { changePermissions ( id: "${instance.getId()}", permissions: ["test"]){ id, permissions }}`;
    const x = await graphql(schema, q);
    expect(x).toHaveProperty("data.changePermissions.id");
    expect(x).toHaveProperty("data.changePermissions.permissions", ["test"]);
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
