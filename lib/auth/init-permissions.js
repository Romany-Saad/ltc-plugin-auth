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
exports.initPermissions = (app, unprotectedEndpoints = [], customPermissions) => __awaiter(this, void 0, void 0, function* () {
    // repository declarations
    const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    // get all endpoints from plugins
    let queryEndpoints = graphql_compose_1.schemaComposer.rootQuery().getFields();
    let mutationEndpoints = graphql_compose_1.schemaComposer.rootMutation().getFields();
    // TODO: find a workaround to add subscriptions
    // let subscriptionEndpoints = schemaComposer.rootSubscription().getFields()
    // get all the endpoints that doesn't exist in db
    let newEndpoints = [];
    for (let endpoint in queryEndpoints) {
        let data = {
            endpoint: endpoint,
            name: endpoint,
            protected: true,
            type: 'query',
        };
        if (unprotectedEndpoints.indexOf(endpoint) > -1) {
            data.protected = false;
        }
        newEndpoints.push(data);
    }
    for (let endpoint in mutationEndpoints) {
        let data = {
            endpoint: endpoint,
            name: endpoint,
            protected: true,
            type: 'mutation',
        };
        if (unprotectedEndpoints.indexOf(endpoint) > -1) {
            data.protected = false;
        }
        newEndpoints.push(data);
    }
    // check if any of the customPermissions isn't in permissions
    newEndpoints.push(...customPermissions);
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
    // app.bind(names.AUTH_PERMISSIONS_GRAPHQL_CONFIG).toConstantValue(newEndpoints)
    app.bind(index_1.names.AUTH_PERMISSIONS_GRAPHQL_CONFIG).toConstantValue(newEndpoints);
    const authPlugin = app.getPlugin('cyber-crafts.cms-plugin-auth');
    authPlugin.setGraphQlAuthConfig(newEndpoints);
    if (newEndpoints.length) {
        let userConfig = app.config().get('auth').admin;
        // check if admin user already exists
        let user = (yield userRepo.find({ email: userConfig.email }))[0];
        // if exists and permissions > 0 then update
        if (user) {
            if (newEndpoints.length > 0) {
                // check if the old permissions were ids or objects
                // if ids then convert them to objects
                const allPermissions = [];
                for (let permission of user.data.permissions) {
                    if (typeof permission === 'string') {
                        let current = newEndpoints.find(p => p.getId() === permission);
                        allPermissions.push({
                            name: current.name,
                            data: {},
                        });
                    }
                    else {
                        allPermissions.push(permission);
                    }
                }
                // push the new permissions to allPermissions and then replace in user
                allPermissions.push(...newEndpoints.map(p => {
                    return { name: p.name, data: {} };
                }));
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
                permissions: newEndpoints.map(p => {
                    return { name: p.name, data: {} };
                }),
                name: userConfig.name,
            };
            let newUser = userRepo.parse(userData);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                userRepo.insert([newUser])
                    .catch(err => {
                    throw new Error(err);
                });
            }
            else {
                console.log('something', validation);
            }
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
    }
});
function availableRoutes(app) {
    return app.express._router.stack
        .filter((r) => r.route)
        .map((r) => {
        return {
            method: Object.keys(r.route.methods)[0].toUpperCase(),
            path: r.route.path,
        };
    });
}
