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
exports.default = (container) => {
    const repository = container
        .get(index_1.names.AUTH_USERS_REPOSITORY);
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
            args: { username: 'String!', password: 'String!' },
            resolve: (obj, args, context, info) => __awaiter(this, void 0, void 0, function* () {
                let user = (yield repository.find({ username: args.username }))[0];
                let serializedUser = transform(user);
                return bcrypt.compare(args.password, serializedUser.password)
                    .then((res) => {
                    if (res) {
                        let token = jwt.encode({ userID: user.getId() }, 'LTC_SECRET');
                        let authedUser = {
                            id: user.getId(),
                            username: serializedUser.username,
                            token: token,
                            authorization: serializedUser.permissions
                        };
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
        changePermissions: {
            type: 'User!',
            args: { id: 'ID!', permissions: '[String!]!' },
            resolve: (obj, { id, permissions }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const items = (yield repository.findByIds([id]));
                if (items.length > 0) {
                    const item = items[0];
                    const data = lodash_1.merge(transform(items[0]), { permissions: permissions });
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
        }
    });
};
