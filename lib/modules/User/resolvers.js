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
const index_1 = require("../../index");
require("./schema");
const graphql_compose_1 = require("graphql-compose");
const ltc_plugin_mail_1 = require("ltc-plugin-mail");
const schema_1 = require("./schema");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");
const RandExp = require('randexp');
const transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
const dataToModel = (data) => {
    if (data.password) {
        return bcrypt.hash(data.password, 10)
            .then(function (hash) {
            // Store hash in your password DB.
            data.password = hash;
            return data;
        })
            .catch(err => {
            console.log(err);
        });
    }
    else {
        return data;
    }
};
const resetDataToModel = (app, email) => __awaiter(this, void 0, void 0, function* () {
    let pr = {};
    let userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    let user = (yield userRepo.find({ email: email }))[0];
    pr.userId = user.getId();
    pr.secretCode = new RandExp(/^.{64}$/).gen();
    pr.createdAt = new Date(Date.now());
    pr.state = 'pending';
    return pr;
});
exports.default = (container) => {
    const repository = container
        .get(index_1.names.AUTH_USERS_REPOSITORY);
    // const permissionRepo = container
    //   .get<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY)
    const resetRepo = container
        .get(index_1.names.AUTH_PASSWORD_RESET_REPOSITORY);
    // Queries ===================================
    schema_1.UserTC.addResolver({
        name: 'getUser',
        type: 'User!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = yield repository.findByIds([args.id]);
            return (items.length !== 1) ? undefined : transform(items[0]);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'getUsers',
        type: '[User!]!',
        args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const users = yield repository.find(args.filter, args.limit, args.skip);
            return users.map(transform);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'countUsers',
        type: 'Int!',
        args: { filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            return yield repository.count(args.filter);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'login',
        type: 'AuthedUser!',
        args: { email: 'String!', password: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            let user = (yield repository.find({ email: args.email }))[0];
            if (!user) {
                throw new Error('can not find user');
            }
            if (user.data.status === 'banned') {
                throw new Error('This user is banned.');
            }
            /*let permissionsNames: any = await permissionRepo.findByIds(user.data.permissions, 1000)
            if (permissionsNames.length > 0) {
              permissionsNames = permissionsNames.map((permission: any) => {
                return permission.data.name
              })
            }*/
            let serializedUser = transform(user);
            return bcrypt.compare(args.password, serializedUser.password)
                .then((res) => {
                if (res) {
                    let token = jwt.encode({ userId: user.getId() }, container.config().get('auth').secret);
                    let authedUser = {
                        id: user.getId(),
                        token: token,
                        permissions: user.data.permissions,
                        email: user.data.email,
                    };
                    if (user.data.name) {
                        authedUser.name = user.data.name;
                    }
                    return authedUser;
                }
                else {
                    throw new Error('Invalid credentials.');
                }
            });
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'checkToken',
        type: 'Boolean!',
        args: { token: 'String!' },
        resolve: ({ source, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            let token = jwt.decode(args.token, container.config().get('auth').secret);
            const user = yield repository.findByIds([token.userId]);
            if (user.length === 0) {
                return false;
            }
            if (user[0].data.status != 'active') {
                return false;
            }
            return !!token;
        }),
    });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ getUser: schema_1.UserTC.getResolver('getUser') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ getUsers: schema_1.UserTC.getResolver('getUsers') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ countUsers: schema_1.UserTC.getResolver('countUsers') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ login: schema_1.UserTC.getResolver('login') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ checkToken: schema_1.UserTC.getResolver('checkToken') });
    // Mutations ===================================
    schema_1.UserTC.addResolver({
        name: 'addUser',
        type: 'User',
        args: { input: 'NewUser!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const data = yield dataToModel(args.input);
            let defaultPermissions = container.config().get('auth').user.defaultPermissions || [];
            data.permissions = defaultPermissions.length > 0 ? defaultPermissions
                .map((p) => {
                return { name: p, data: {} };
            }) : [];
            data.status = 'active';
            let newUser = repository.parse(data);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                newUser = (yield repository.insert([newUser]))[0];
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let msg = container.config().get('auth.registerMessage');
                if (msg) {
                    msg = msg.replace(/<<name>>/, data.name);
                }
                else {
                    msg = `<h3>Welcome ${data.name}, </h3><br> <p>Your registration is successful</p>`;
                }
                let mailOptions = {
                    from: 'admin',
                    to: data.email,
                    subject: 'Hassan Kutbi - Welcome to Arabian drive',
                    html: msg,
                };
                try {
                    yield transporter.sendMail(mailOptions);
                }
                catch (e) {
                    console.log(e);
                }
                return transform(newUser);
            }
            else {
                throw new Error(JSON.stringify(validation.errors[0]));
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'deleteUser',
        type: 'Boolean!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const item = (yield repository.findByIds([args.id]));
            if (item && (yield repository.remove(item))) {
                return true;
            }
            else {
                throw new Error('no User with this id was found');
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'updateUser',
        type: 'User!',
        args: { id: 'ID!', input: 'UserPatch!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = (yield repository.findByIds([args.id]));
            if (items.length > 0) {
                const item = items[0];
                const data = utils_1.merge(transform(items[0]), args.input);
                item.set(data);
                if (yield repository.update([item])) {
                    return transform(item);
                }
            }
            else {
                throw new Error('no User with this id was found');
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'changePassword',
        type: 'Boolean!',
        args: { id: 'ID!', oldPassword: 'String!', newPassword: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = (yield repository.findByIds([args.id]));
            if (items.length > 0) {
                const item = items[0];
                let match = yield bcrypt.compare(args.oldPassword, item.data.password);
                if (!match) {
                    throw new Error('Invalid credentials.');
                }
                const data = utils_1.merge(transform(items[0]), { password: args.newPassword });
                item.set(yield dataToModel(data));
                if (yield repository.update([item])) {
                    return true;
                }
            }
            else {
                throw new Error('no User with this id was found');
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'changeEmail',
        type: 'Boolean!',
        args: { id: 'ID!', newEmail: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = (yield repository.findByIds([args.id]));
            if (items.length > 0) {
                const item = items[0];
                const data = utils_1.merge(transform(items[0]), { email: args.newEmail });
                item.set(data);
                if (yield repository.update([item])) {
                    return true;
                }
            }
            else {
                throw new Error('no User with this id was found');
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'resetPassword',
        type: 'Boolean!',
        args: { email: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const data = yield resetDataToModel(container, args.email);
            let newPasswordReset = resetRepo.parse(data);
            let validation = yield newPasswordReset.selfValidate();
            if (validation.success) {
                newPasswordReset = (yield resetRepo.insert([newPasswordReset]))[0];
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let mailOptions = {
                    from: 'admin',
                    to: args.email,
                    subject: 'Hassan Kutbi - Password reset request',
                    // html: '<b>Hello world?</b>' // html body
                    text: newPasswordReset.secretCode,
                };
                return transporter.sendMail(mailOptions)
                    .then((info) => {
                    if (info.accepted.length > 0) {
                        return true;
                    }
                })
                    .catch((err) => {
                    console.log(err);
                    throw new Error('Error sending verification email.');
                });
                // return transform(newPasswordReset)
            }
            else {
                throw new Error(JSON.stringify(validation.errors[0]));
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'verifyResetPassword',
        type: 'Boolean!',
        args: { id: 'ID!', code: 'String!', password: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            let instance = (yield resetRepo.findByIds([args.id]))[0];
            let userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
            if (instance.data.secretCode === args.code) {
                let rpInstanceData = utils_1.merge(transform(instance), { state: 'processed' });
                instance.set(rpInstanceData);
                let updatedRp = resetRepo.update([instance]);
                let user = (yield userRepo.findByIds([rpInstanceData.userId]))[0];
                let newPassword = yield bcrypt.hash(args.password, 10);
                let userData = utils_1.merge(transform(user), { password: newPassword });
                user.set(userData);
                let updatedUser = userRepo.update([user]);
                return Promise.all([updatedRp, updatedUser])
                    .then(res => {
                    return true;
                })
                    .catch(err => {
                    return false;
                });
            }
            else {
                return false;
            }
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'register',
        type: 'AuthedUser!',
        args: { input: 'NewUser!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const data = yield dataToModel(args.input);
            let defaultPermissions = container.config().get('auth').user.defaultPermissions || [];
            data.permissions = defaultPermissions.length > 0 ? defaultPermissions
                .map((p) => {
                return { name: p, data: {} };
            }) : [];
            data.status = 'active';
            let newUser = repository.parse(data);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                newUser = (yield repository.insert([newUser]))[0];
                let token = jwt.encode({ userId: newUser.getId() }, container.config().get('auth').secret);
                let authedUser = {
                    id: newUser.getId(),
                    token: token,
                    permissions: data.permissions,
                    email: newUser.data.email,
                };
                if (newUser.data.name) {
                    authedUser.name = newUser.data.name;
                }
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let msg = container.config().get('auth.registerMessage');
                if (msg) {
                    msg = msg.replace(/<<name>>/, data.name);
                }
                else {
                    msg = `<h3>Welcome ${data.name}, </h3><br> <p>Your registration is successful</p>`;
                }
                let mailOptions = {
                    from: 'admin',
                    to: data.email,
                    subject: 'Hassan Kutbi - Welcome to Arabian drive',
                    html: msg,
                };
                try {
                    yield transporter.sendMail(mailOptions);
                }
                catch (e) {
                    console.log(e);
                }
                return authedUser;
            }
            else {
                throw new Error(JSON.stringify(validation.errors[0]));
            }
        }),
    });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ addUser: schema_1.UserTC.getResolver('addUser') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ deleteUser: schema_1.UserTC.getResolver('deleteUser') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ updateUser: schema_1.UserTC.getResolver('updateUser') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ changePassword: schema_1.UserTC.getResolver('changePassword') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ changeEmail: schema_1.UserTC.getResolver('changeEmail') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ resetPassword: schema_1.UserTC.getResolver('resetPassword') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ verifyResetPassword: schema_1.UserTC.getResolver('verifyResetPassword') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ register: schema_1.UserTC.getResolver('register') });
};
