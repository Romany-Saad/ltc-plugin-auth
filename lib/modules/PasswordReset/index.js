"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("./model");
exports.PasswordReset = model_1.default;
var repository_1 = require("./repository");
exports.PasswordResets = repository_1.default;
var resolvers_1 = require("./resolvers");
exports.resolvers = resolvers_1.default;
/*
// adding the repository to the container ./src/index.ts
import { PasswordReset, PasswordResets } from "./modules/Test"

container.bind<PasswordReset>(`${this.name}.repository.PasswordResets`)
  .toConstantValue(new PasswordResets(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/PasswordReset/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as PasswordResetResolvers } from "../modules/PasswordReset"
then merge it with other resolvers
*/
