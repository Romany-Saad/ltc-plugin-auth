"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
const utils_2 = require("ltc-plugin-templating/lib/utils");
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
const resetDataToModel = (user) => __awaiter(void 0, void 0, void 0, function* () {
    let pr = {};
    pr.userId = user.getId();
    pr.secretCode = new RandExp(/^[a-z0-9]{8}$/).gen();
    pr.createdAt = new Date(Date.now());
    pr.state = 'pending';
    return pr;
});
const getAuthedUser = (app, user) => {
    const authConfig = app.config().get('auth');
    let token = jwt.encode({ userId: user.getId() }, authConfig.secret);
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
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const items = yield repository.findByIds([args.id]);
            return (items.length !== 1) ? undefined : transform(items[0]);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'getUsers',
        type: '[User!]!',
        args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const users = yield repository.find(args.filter, args.limit, args.skip);
            return users.map(transform);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'countUsers',
        type: 'Int!',
        args: { filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            return yield repository.count(args.filter);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'login',
        type: 'AuthedUser!',
        args: { email: 'String!', password: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            let user = (yield repository.find({ email: args.email }))[0];
            if (!user) {
                throw new Error('can not find user');
            }
            if (user.data.status === 'banned') {
                throw new Error('This user is banned.');
            }
            let serializedUser = transform(user);
            return bcrypt.compare(args.password, serializedUser.password)
                .then((res) => {
                if (res) {
                    return getAuthedUser(container, user);
                }
                else {
                    throw new Error('Invalid credentials.');
                }
            });
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'checkToken',
        type: 'AuthedUser',
        args: { token: 'String!' },
        resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            let token = jwt.decode(args.token, container.config().get('auth').secret);
            let user = yield repository.findByIds([token.userId]);
            if (user.length === 0) {
                return null;
            }
            if (user[0].get('status') != 'active') {
                return null;
            }
            return getAuthedUser(container, user[0]);
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'getRoles',
        type: '[UserRole]!',
        resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const roles = source.config().get('auth.roles');
            return roles || [];
        }),
    });
    graphql_compose_1.schemaComposer.Query.addFields({ getUser: schema_1.UserTC.getResolver('getUser') });
    graphql_compose_1.schemaComposer.Query.addFields({ getUsers: schema_1.UserTC.getResolver('getUsers') });
    graphql_compose_1.schemaComposer.Query.addFields({ countUsers: schema_1.UserTC.getResolver('countUsers') });
    graphql_compose_1.schemaComposer.Query.addFields({ login: schema_1.UserTC.getResolver('login') });
    graphql_compose_1.schemaComposer.Query.addFields({ checkToken: schema_1.UserTC.getResolver('checkToken') });
    graphql_compose_1.schemaComposer.Query.addFields({ getRoles: schema_1.UserTC.getResolver('getRoles') });
    // Mutations ===================================
    schema_1.UserTC.addResolver({
        name: 'addUser',
        type: 'User',
        args: { input: 'NewUser!' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield dataToModel(args.input);
            data.permissions = [];
            data.status = 'active';
            let newUser = repository.parse(data);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                newUser = (yield repository.insert([newUser]))[0];
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let emailConfig = container.config().get('auth.emails.addUser');
                let mailOptions = {
                    from: 'admin',
                    to: data.email,
                    subject: emailConfig.subject,
                    html: utils_2.render(emailConfig.templatePath, {
                        user: {
                            name: data.name,
                        },
                    }),
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
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
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
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
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
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
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
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
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
        resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const authConfig = container.config().get('auth');
            let userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
            let user = (yield userRepo.find({ email: args.email }))[0];
            if (!user) {
                throw new Error('Invalid email.');
            }
            const data = yield resetDataToModel(user);
            let newPasswordReset = resetRepo.parse(data);
            let validation = yield newPasswordReset.selfValidate();
            if (validation.success) {
                newPasswordReset = (yield resetRepo.insert([newPasswordReset]))[0];
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let emailConfig = container.config().get('auth.emails.resetPassword');
                let mailOptions = {
                    from: 'admin',
                    to: args.email,
                    subject: emailConfig.subject,
                    html: utils_2.render(emailConfig.templatePath, {
                        user: {
                            name: user.get('name'),
                            secretCode: newPasswordReset.get('secretCode'),
                            resetId: newPasswordReset.getId(),
                        },
                        host: container.config().get('http.clientUrl'),
                    }),
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
        args: { code: 'String!', password: 'String!' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            let instance = (yield resetRepo.find({ secretCode: args.code }))[0];
            if (!instance) {
                throw new Error('Invalid code');
            }
            const timeLimit = new Date(instance.get('createdAt'));
            timeLimit.setMinutes(timeLimit.getMinutes() + 10);
            if (new Date(timeLimit) < new Date()) {
                throw new Error('secret code time out.');
            }
            const userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
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
        }),
    });
    schema_1.UserTC.addResolver({
        name: 'register',
        type: 'AuthedUser!',
        args: { input: 'Register!' },
        resolve: ({ obj, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
            const authConfig = container.config().get('auth');
            const data = yield dataToModel(args.input);
            data.permissions = [];
            data.status = 'active';
            let newUser = repository.parse(data);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                delete newUser.data.grecaptchaToken;
                newUser = (yield repository.insert([newUser]))[0];
                let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                let emailConfig = container.config().get('auth.emails.register');
                let mailOptions = {
                    from: 'admin',
                    to: data.email,
                    subject: emailConfig.subject,
                    html: utils_2.render(emailConfig.templatePath, {
                        user: {
                            name: data.name,
                        },
                    }),
                };
                try {
                    yield transporter.sendMail(mailOptions);
                }
                catch (e) {
                    console.log(e);
                }
                return getAuthedUser(container, newUser);
            }
            else {
                throw new Error(JSON.stringify(validation.errors[0]));
            }
        }),
    });
    graphql_compose_1.schemaComposer.Mutation.addFields({ addUser: schema_1.UserTC.getResolver('addUser') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ deleteUser: schema_1.UserTC.getResolver('deleteUser') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ updateUser: schema_1.UserTC.getResolver('updateUser') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ changePassword: schema_1.UserTC.getResolver('changePassword') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ changeEmail: schema_1.UserTC.getResolver('changeEmail') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ resetPassword: schema_1.UserTC.getResolver('resetPassword') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ verifyResetPassword: schema_1.UserTC.getResolver('verifyResetPassword') });
    graphql_compose_1.schemaComposer.Mutation.addFields({ register: schema_1.UserTC.getResolver('register') });
};
