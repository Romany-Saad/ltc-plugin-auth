const registerPluginsAndInitApp = require("./mocks/app");
const { schemaComposer } = require('graphql-compose');

let app, schema;
beforeAll(async () => {
  app = await registerPluginsAndInitApp();
  schema = schemaComposer.buildSchema();
});

describe("app should be initialized", () => {
  it("should have plugins", () => {
    expect(Object.keys('_plugins').length).toBeGreaterThan(0);
  });
});
