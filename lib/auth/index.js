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
const jwt = require("jwt-simple");
const index_1 = require("../index");
class Auth {
    constructor(container, authorizaionHeader) {
        this.app = container;
        this.authorizationData = jwt.decode(this.getTokenFromHeader(authorizaionHeader), container.config().get('auth').secret);
    }
    getTokenFromHeader(token) {
        return token.match(/Bearer (.+)/)[1];
    }
    getAuthedUser() {
        return this.authorizationData;
    }
    initUserPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const permissionRepo = this.app.get(index_1.names.AUTH_PERMISSIONS_REPOSITORY);
            const userRepo = this.app.get(index_1.names.AUTH_USERS_REPOSITORY);
            let user = (yield userRepo.findByIds([this.authorizationData.userId]))[0];
            let permissions = user.data.permissions.map((p) => p.name);
            let permissionsNames;
            if (permissions.length > 0) {
                permissions = yield permissionRepo.find({ name: { $in: permissions } }, 1000);
                permissionsNames = permissions.length > 0 ? permissions.map((p) => {
                    return { name: p.data.name, data: {} };
                }) : [];
            }
            else {
                permissionsNames = [];
            }
            this.authorizationData.permissions = permissionsNames;
            return this.authorizationData.permissions;
        });
    }
}
exports.default = Auth;
