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
const graphql_compose_1 = require("graphql-compose");
const index_1 = require("../index");
const ltc_plugin_mail_1 = require("ltc-plugin-mail");
const bcrypt = require("bcrypt");
exports.initPermissions = (app) => __awaiter(this, void 0, void 0, function* () {
    // repository declarations
    const permissionsRepo = app.get(index_1.names.AUTH_PERMISSIONS_REPOSITORY);
    const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    // get existing endpoints in database
    const databasesPermissions = yield permissionsRepo.find({}, 0);
    let databaseEndpoints = databasesPermissions.map(permission => {
        return permission.data.endpoint;
    });
    // get all endpoints from plugins
    let queryEndpoints = graphql_compose_1.schemaComposer.rootQuery().getFields();
    let mutationEndpoints = graphql_compose_1.schemaComposer.rootMutation().getFields();
    // TODO: find a workaround to add subscriptions
    // let subscriptionEndpoints = schemaComposer.rootSubscription().getFields()
    // get all the endpoints that doesn't exist in db
    let newEndpoints = [];
    for (let endpoint in queryEndpoints) {
        if (databaseEndpoints.indexOf(endpoint) === -1) {
            let data = {
                endpoint: endpoint,
                name: endpoint,
                protected: true,
                type: 'query',
            };
            if (unprotectedEndpoints.indexOf(endpoint) === -1) {
                data.protected = false;
            }
            newEndpoints.push(permissionsRepo.parse(data));
        }
    }
    for (let endpoint in mutationEndpoints) {
        if (databaseEndpoints.indexOf(endpoint) === -1) {
            let data = {
                endpoint: endpoint,
                name: endpoint,
                protected: true,
                type: 'mutation',
            };
            if (unprotectedEndpoints.indexOf(endpoint) === -1) {
                data.protected = false;
            }
            newEndpoints.push(permissionsRepo.parse(data));
        }
    }
    /*for (let endpoint in subscriptionEndpoints) {
      console.log(endpoint)
      if (databaseEndpoints.indexOf(endpoint) === -1) {
        newEndpoints.push(permissionsRepo.parse({
          endpoint: endpoint,
          name: endpoint,
          protected: true,
          type: 'subscription',
        }))
      }
    }*/
    if (newEndpoints.length) {
        permissionsRepo.insert(newEndpoints)
            .then((permissions) => __awaiter(this, void 0, void 0, function* () {
            let permissionsIds = permissions.map(permission => {
                return permission.getId();
            });
            let userConfig = app.config().get('auth').admin;
            // check if admin user already exists
            let user = (yield userRepo.find({ email: userConfig.email }))[0];
            // if exists and permissions > 0 then update
            if (user) {
                if (permissions.length > 0) {
                    let allPermissions = user.data.permissions.concat(permissionsIds);
                    allPermissions = [...new Set(allPermissions)];
                    user.set({ permissions: allPermissions });
                    userRepo.update([user])
                        .catch(err => {
                        console.log(err);
                    });
                }
            }
            else {
                // if user doesn't exist create it and give it all the permissions
                let userData = {
                    email: userConfig.email,
                    password: yield bcrypt.hash(userConfig.password, 10),
                    status: 'active',
                    permissions: permissionsIds,
                    name: userConfig.name,
                };
                let newUser = userRepo.parse(userData);
                userRepo.insert([newUser])
                    .catch(err => {
                    throw new Error(err);
                });
                //  send the user data to the specified email
                let transporter = app.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let mailOptions = {
                    from: 'admin',
                    to: userConfig.email,
                    subject: 'Hassan Kutbi - admin account data',
                    html: `<h1>Your login data: </h1><br>` +
                        `<p>name: ${userConfig.name}</p>` +
                        `<p>password: ${userConfig.password}</p>`,
                };
                transporter.sendMail(mailOptions)
                    .catch((err) => {
                    console.log(err);
                });
            }
        }))
            .catch(err => {
            throw new Error(err);
        });
    }
});
const unprotectedEndpoints = [
    'login',
    'register',
    'getVideos',
    'getModels',
    'getCompanies'
];
