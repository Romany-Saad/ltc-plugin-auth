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
const utils_1 = require("../../utils");
const { OAuth2Client } = require('google-auth-library');
const jwt = require("jwt-simple");
const index_1 = require("../../index");
exports.transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
exports.verifyGoogleIdToken = (app, token) => __awaiter(this, void 0, void 0, function* () {
    const googleAuthConfig = app.config().get('auth.google');
    const client = new OAuth2Client(googleAuthConfig.client_id);
    const ticket = yield client.verifyIdToken({
        idToken: token,
        audience: googleAuthConfig.client_id,
    });
    return ticket.getPayload();
});
exports.getAuthedUser = (app, user, authData) => {
    const authConfig = app.config().get('auth');
    let token = jwt.encode({
        userId: user.getId(),
        authenticatedVia: authData.authedVia || 'api',
        lastAuthenticated: authData.lastAuthenticated || new Date(),
    }, authConfig.secret);
    let permissions = user.get('permissions').map((p) => {
        return {
            name: p.name,
            data: p.data,
        };
    });
    const defaultPermissions = authConfig.user.defaultPermissions;
    const roles = authConfig.roles;
    if (defaultPermissions) {
        permissions.push(...defaultPermissions.map((p) => {
            return {
                name: p.name,
                data: p.data,
            };
        }));
    }
    if (user.get('roles')) {
        for (let role of user.get('roles')) {
            let currentRole = roles.find((configRole) => configRole.name === role);
            if (currentRole) {
                currentRole.permissions.forEach((p) => {
                    permissions.push({
                        name: p.name,
                        data: p.data,
                    });
                });
            }
        }
    }
    let authedUser = {
        id: user.getId(),
        token: token,
        permissions: permissions,
        email: user.get('email'),
    };
    if (user.get('name')) {
        authedUser.name = user.get('name');
    }
    return authedUser;
};
exports.loginUser = (app, user, loginVia) => __awaiter(this, void 0, void 0, function* () {
    const repository = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    const authenticationDate = new Date();
    let authentication = user.get('authentication');
    if (authentication[loginVia]) {
        authentication[loginVia].push(authenticationDate);
    }
    else {
        authentication[loginVia] = [authenticationDate];
    }
    const data = utils_1.merge(exports.transform(user), {
        authentication: authentication,
    });
    user.set(data);
    if (yield repository.update([user])) {
        return exports.getAuthedUser(app, user, {
            authedVia: loginVia,
            lastAuthenticated: authenticationDate,
        });
    }
    else {
        return false;
    }
});
