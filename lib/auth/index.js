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
            const userRepo = this.app.get(index_1.names.AUTH_USERS_REPOSITORY);
            let user = (yield userRepo.findByIds([this.authorizationData.userId]))[0];
            if (!user) {
                throw new Error('Invalid token');
            }
            let permissions = user.data.permissions.map((p) => {
                return {
                    name: p.name,
                    description: '',
                };
            });
            const defaultPermissions = this.app.config().get('auth.user.defaultPermissions');
            if (defaultPermissions) {
                permissions.push(...defaultPermissions.map((p) => {
                    return {
                        name: p,
                        description: '',
                    };
                }));
            }
            this.authorizationData.permissions = permissions;
            return this.authorizationData.permissions;
        });
    }
}
exports.default = Auth;
