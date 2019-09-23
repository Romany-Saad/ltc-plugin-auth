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
const ltc_core_1 = require("@cyber-crafts/ltc-core");
const resolvers_1 = require("./schema/resolvers");
const utils_1 = require("@cyber-crafts/ltc-core/lib/utils");
const ltc_plugin_mongo_1 = require("ltc-plugin-mongo");
const c2v_1 = require("c2v");
// import { Permissions } from './modules/Permission'
const User_1 = require("./modules/User");
const PasswordReset_1 = require("./modules/PasswordReset");
const init_permissions_1 = require("./auth/init-permissions");
const listener_1 = require("./modules/User/listener");
const utils_2 = require("./utils");
const passport = require("passport");
exports.names = {
    // AUTH_PERMISSIONS_REPOSITORY: Symbol(namer.resolve('auth', 'permissions', 'repository')),
    AUTH_PERMISSIONS_GRAPHQL_CONFIG: Symbol(utils_1.namer.resolve('auth', 'permissions', 'config')),
    AUTH_USERS_REPOSITORY: Symbol(utils_1.namer.resolve('auth', 'users', 'repository')),
    AUTH_PASSWORD_RESET_REPOSITORY: Symbol(utils_1.namer.resolve('auth', 'passwordResets', 'repository')),
};
class default_1 {
    constructor(customData) {
        this.name = 'cyber-crafts.cms-plugin-auth';
        this.authConfig = {};
        this.customData = customData;
    }
    /*
    * used to provide access to the App container to register
    * the plugin's services and resources
    * */
    load(container) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = container.config();
            const connection = container.get(ltc_plugin_mongo_1.names.MONGO_SERVICES_CONNECTION);
            // const permissions = new Permissions(connection.getClient(), `permissions`)
            // container.bind<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY).toConstantValue(permissions)
            // Context.bind(names.AUTH_PERMISSIONS_REPOSITORY, permissions)
            const users = new User_1.Users(connection.getClient(), `users`);
            container.bind(exports.names.AUTH_USERS_REPOSITORY).toConstantValue(users);
            c2v_1.Context.bind(exports.names.AUTH_USERS_REPOSITORY, users);
            const passwordResets = new PasswordReset_1.PasswordResets(connection.getClient(), `passwordResets`);
            container.bind(exports.names.AUTH_PASSWORD_RESET_REPOSITORY).toConstantValue(passwordResets);
            c2v_1.Context.bind(exports.names.AUTH_PASSWORD_RESET_REPOSITORY, passwordResets);
            resolvers_1.default(container);
            container.emitter.on(ltc_core_1.names.EV_PLUGINS_LOADED, (items) => __awaiter(this, void 0, void 0, function* () {
                init_permissions_1.initPermissions(container, this.customData)
                    .then(() => {
                    console.log('init permissions done');
                    this.setAvailablePermissions(this.customData.permissions);
                    container.emitter.emit('PERMISSIONS_INIT_DONE');
                })
                    .catch(err => {
                    throw new Error(err);
                });
            }));
            listener_1.default(container);
            container.express.get('/twitter/oauth', passport.authenticate('twitter'));
            container.express.get('/google/oauth', passport.authenticate('google', { scope: 'profile email' }));
            // passport.authenticate('google', {scope: 'openid,profile,email'}))
            container.express.get('/oauth/callback', (req, res, next) => {
                if (req.query.platform === 'twitter') {
                    passport.authenticate('twitter')(req, res, next);
                }
                else if (req.query.platform === 'google') {
                    passport.authenticate('google', { scope: 'profile email' })(req, res, next);
                }
                else if (req.query.platform === 'google') {
                    passport.authenticate('google', { scope: 'profile email' })(req, res, next);
                }
                else {
                    res.status(400);
                    res.json({
                        status: 'fail',
                        msg: 'Invalid platform.',
                    });
                }
            }, (req, res, next) => utils_2.socialMediaLogin(container, req.query.platform, req.user, res, next));
        });
    }
    setGraphQlAuthConfig(configs) {
        this.authConfig.graphQl = configs;
    }
    setRestAuthConfig(configs) {
        this.authConfig.rest = configs;
    }
    setAvailablePermissions(customPermissions = null) {
        this.availablePermissions = [];
        this.availablePermissions.push(...this.authConfig.rest.map((config) => {
            return { name: config.path, description: '' };
        }));
        this.availablePermissions.push(...this.authConfig.graphQl.map((config) => {
            return { name: config.endpoint, description: '' };
        }));
        if (customPermissions) {
            this.availablePermissions.push(...customPermissions);
        }
    }
}
exports.default = default_1;
