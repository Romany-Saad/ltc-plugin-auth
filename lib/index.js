"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolvers_1 = require("./schema/resolvers");
const utils_1 = require("@lattice/core/lib/utils");
const ltc_plugin_mongo_1 = require("ltc-plugin-mongo");
const c2v_1 = require("c2v");
const Permission_1 = require("./modules/Permission");
const User_1 = require("./modules/User");
exports.names = {
    AUTH_PERMISSIONS_REPOSITORY: Symbol(utils_1.namer.resolve("auth", "permissions", "repository")),
    AUTH_USERS_REPOSITORY: Symbol(utils_1.namer.resolve("auth", "users", "repository")),
};
class default_1 {
    constructor() {
        this.name = "cyber-crafts.cms-plugin-auth";
    }
    /*
    * used to provide access to the App container to register
    * the plugin's services and resources
    * */
    load(container) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = container.config();
            const connection = container.get(ltc_plugin_mongo_1.names.MONGO_SERVICES_CONNECTION);
            const permissions = new Permission_1.Permissions(connection.getClient(), `permissions`);
            container.bind(exports.names.AUTH_PERMISSIONS_REPOSITORY).toConstantValue(permissions);
            c2v_1.Context.bind(exports.names.AUTH_PERMISSIONS_REPOSITORY, permissions);
            const users = new User_1.Users(connection.getClient(), `users`);
            container.bind(exports.names.AUTH_USERS_REPOSITORY).toConstantValue(users);
            c2v_1.Context.bind(exports.names.AUTH_USERS_REPOSITORY, users);
            resolvers_1.default(container);
        });
    }
}
exports.default = default_1;
