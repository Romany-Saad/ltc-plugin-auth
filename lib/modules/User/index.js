"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("./model");
exports.User = model_1.default;
var repository_1 = require("./repository");
exports.Users = repository_1.default;
var resolvers_1 = require("./resolvers");
exports.resolvers = resolvers_1.default;
/*
// adding the repository to the container ./src/index.ts
import { User, Users } from "./modules/Test"

container.bind<User>(`${this.name}.repository.Users`)
  .toConstantValue(new Users(connection.getClient(),`${config.value().db.collectionPrefix}`))

// adding the schema ./src/schema/typeDefs.ts
let typeDefs = fs.readFileSync(rootPath("src/modules/User/schema.ts"), {encoding: "utf8"})

// import schema resolvers ./src/schema/resolvers.ts
import { resolvers as UserResolvers } from "../modules/User"
then merge it with other resolvers
*/
