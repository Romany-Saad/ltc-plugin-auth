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
const lodash_1 = require("lodash");
const index_1 = require("../../index");
require("./schema");
const graphql_compose_1 = require("graphql-compose");
const bcrypt = require("bcrypt");
const jwt = require("jwt-simple");
const ltc_plugin_mail_1 = require("ltc-plugin-mail");
const RandExp = require('randexp');
const transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
const dataToModel = (data) => {
    if (data.hasOwnProperty('password')) {
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
    const resetRepo = container
        .get(index_1.names.AUTH_PASSWORD_RESET_REPOSITORY);
    graphql_compose_1.schemaComposer.Query.addFields({
        getUser: {
            type: 'User!',
            args: { id: 'ID!' },
            resolve: (obj, { id }) => __awaiter(this, void 0, void 0, function* () {
                const items = yield repository.findByIds([id]);
                return (items.length !== 1) ? undefined : transform(items[0]);
            }),
        },
        getUsers: {
            type: '[User!]!',
            args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
            resolve: (obj, { skip, limit, filter }) => __awaiter(this, void 0, void 0, function* () {
                const users = yield repository.find(filter, limit, skip);
                return users.map(transform);
            }),
        },
        countUsers: {
            type: 'Int!',
            args: { filter: 'JSON' },
            resolve: (obj, { filter }) => __awaiter(this, void 0, void 0, function* () {
                return yield repository.count(filter);
            })
        },
        login: {
            type: 'AuthedUser!',
            args: { email: 'String!', password: 'String!' },
            resolve: (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
                let user = (yield repository.find({ email: args.email }))[0];
                let serializedUser = transform(user);
                return bcrypt.compare(args.password, serializedUser.password)
                    .then((res) => {
                    if (res) {
                        let token = jwt.encode({ userId: user.getId() }, container.config().get('auth').secret);
                        let authedUser = {
                            id: user.getId(),
                            token: token,
                            permissions: user.data.permissions,
                            email: user.data.email
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
            })
        }
    });
    graphql_compose_1.schemaComposer.Mutation.addFields({
        addUser: {
            type: 'User',
            args: { input: 'NewUser!' },
            resolve: (obj, { input }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const data = yield dataToModel(input);
                data.permissions = [];
                data.status = 'active';
                let newUser = repository.parse(data);
                let validation;
                try {
                    validation = yield newUser.selfValidate();
                }
                catch (e) {
                    console.log(e);
                }
                if (validation.success) {
                    newUser = (yield repository.insert([newUser]))[0];
                    return transform(newUser);
                }
                else {
                    throw new Error(JSON.stringify(validation.errors[0]));
                }
            })
        },
        deleteUser: {
            type: 'Boolean!',
            args: { id: 'ID!' },
            resolve: (obj, { id }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const item = (yield repository.findByIds([id]));
                if (item && (yield repository.remove(item))) {
                    return true;
                }
                else {
                    throw new Error("no User with this id was found");
                }
            })
        },
        updateUser: {
            type: 'User!',
            args: { id: 'ID!', input: 'UserPatch!' },
            resolve: (obj, { id, input }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const items = (yield repository.findByIds([id]));
                if (items.length > 0) {
                    const item = items[0];
                    const data = lodash_1.merge(transform(items[0]), input);
                    item.set(yield dataToModel(data));
                    if (yield repository.update([item])) {
                        return transform(item);
                    }
                }
                else {
                    throw new Error("no User with this id was found");
                }
            })
        },
        changePassword: {
            type: 'Boolean!',
            args: { id: 'ID!', newPassword: 'String!' },
            resolve: (obj, { id, newPassword }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const items = (yield repository.findByIds([id]));
                if (items.length > 0) {
                    const item = items[0];
                    const data = lodash_1.merge(transform(items[0]), { password: newPassword });
                    item.set(yield dataToModel(data));
                    if (yield repository.update([item])) {
                        return true;
                    }
                }
                else {
                    throw new Error("no User with this id was found");
                }
            })
        },
        changeEmail: {
            type: 'Boolean!',
            args: { id: 'ID!', newEmail: 'String!' },
            resolve: (obj, { id, newEmail }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const items = (yield repository.findByIds([id]));
                if (items.length > 0) {
                    const item = items[0];
                    const data = lodash_1.merge(transform(items[0]), { email: newEmail });
                    item.set(yield dataToModel(data));
                    if (yield repository.update([item])) {
                        return true;
                    }
                }
                else {
                    throw new Error("no User with this id was found");
                }
            })
        },
        resetPassword: {
            type: 'Boolean!',
            args: { email: 'String!' },
            resolve: (obj, { email }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const data = yield resetDataToModel(container, email);
                let newPasswordReset = resetRepo.parse(data);
                let validation;
                try {
                    validation = yield newPasswordReset.selfValidate();
                }
                catch (e) {
                    console.log(e);
                }
                if (validation.success) {
                    newPasswordReset = (yield resetRepo.insert([newPasswordReset]))[0];
                    let transporter = container.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
                    let mailOptions = {
                        from: 'admin',
                        to: email,
                        subject: 'Hassan Kutbi - Password reset request',
                        // html: '<b>Hello world?</b>' // html body
                        text: newPasswordReset.secretCode // html body
                    };
                    return transporter.sendMail(mailOptions)
                        .then((info) => {
                        if (info.accepted.length > 0) {
                            return true;
                        }
                    })
                        .catch((err) => {
                        throw new Error('Error sending verification email.');
                    });
                    // return transform(newPasswordReset)
                }
                else {
                    throw new Error(JSON.stringify(validation.errors[0]));
                }
            })
        },
        verifyResetPassword: {
            type: 'Boolean!',
            args: { id: 'ID!', code: 'String!', password: 'String!' },
            resolve: (obj, { id, code, password }, context, info) => __awaiter(this, void 0, void 0, function* () {
                let instance = (yield resetRepo.findByIds([id]))[0];
                let userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
                if (instance.data.secretCode === code) {
                    let rpInstanceData = lodash_1.merge(transform(instance), { state: 'processed' });
                    instance.set(rpInstanceData);
                    let updatedRp = resetRepo.update([instance]);
                    let user = (yield userRepo.findByIds([rpInstanceData.userId]))[0];
                    let newPassword = yield bcrypt.hash(password, 10);
                    let userData = lodash_1.merge(transform(user), { password: newPassword });
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
            })
        },
        register: {
            type: 'AuthedUser',
            args: { input: 'NewUser!' },
            resolve: (obj, { input }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const data = yield dataToModel(input);
                data.permissions = [];
                data.status = 'active';
                let newUser = repository.parse(data);
                let validation;
                try {
                    validation = yield newUser.selfValidate();
                }
                catch (e) {
                    console.log(e);
                }
                if (validation.success) {
                    newUser = (yield repository.insert([newUser]))[0];
                    let token = jwt.encode({ userId: newUser.getId() }, container.config().get('auth').secret);
                    let authedUser = {
                        id: newUser.getId(),
                        token: token,
                        permissions: newUser.data.permissions,
                        email: newUser.data.email
                    };
                    if (newUser.data.name) {
                        authedUser.name = newUser.data.name;
                    }
                    return authedUser;
                }
                else {
                    throw new Error(JSON.stringify(validation.errors[0]));
                }
            })
        },
    });
};
