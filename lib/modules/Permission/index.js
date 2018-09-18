"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("./model");
exports.Permission = model_1.default;
var repository_1 = require("./repository");
exports.Permissions = repository_1.default;
var resolvers_1 = require("./resolvers");
exports.resolvers = resolvers_1.default;
/*
// adding the repository to the container ./src/index.ts
import { Permission, Permissions } from "./modules/Test"

container.bind<Permission>(`${this.name}.repository.Permissions`)
  .toConstantValue(new Permissions(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/Permission/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as PermissionResolvers } from "../modules/Permission"
then merge it with other resolvers
*/
