import AMongoDbRepository from "ltc-plugin-mongo/lib/abstractions/AMongoDbRepository";
import { User } from "./index";
import { IStringKeyedObject } from "@lattice/core/lib/contracts";
export default class extends AMongoDbRepository<User> {
    parse(data: IStringKeyedObject): User;
}
