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
const RandExp = require('randexp');
const ltc_plugin_mail_1 = require("ltc-plugin-mail");
const transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
const dataToModel = (app, email) => __awaiter(this, void 0, void 0, function* () {
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
        .get(index_1.names.AUTH_PASSWORD_RESET_REPOSITORY);
    graphql_compose_1.schemaComposer.Query.addFields({
        getPasswordReset: {
            type: 'PasswordReset!',
            args: { id: 'ID!' },
            resolve: (obj, { id }) => __awaiter(this, void 0, void 0, function* () {
                const items = yield repository.findByIds([id]);
                return (items.length !== 1) ? undefined : transform(items[0]);
            }),
        },
        getPasswordResets: {
            type: '[PasswordReset!]!',
            args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
            resolve: (obj, { skip, limit, filter }) => __awaiter(this, void 0, void 0, function* () {
                const distributionCenters = yield repository.find(filter, limit, skip);
                return distributionCenters.map(transform);
            }),
        },
        countPasswordResets: {
            type: 'Int!',
            args: { filter: 'JSON' },
            resolve: (obj, { filter }) => __awaiter(this, void 0, void 0, function* () {
                return yield repository.count(filter);
            })
        }
    });
    graphql_compose_1.schemaComposer.Mutation.addFields({
        /*
        updatePasswordReset: {
            type: 'PasswordReset!',
                args: {id: 'ID!', input: 'PasswordResetPatch!'},
            resolve: async (obj: any, {id, input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), input)
                    item.set(dataToModel(data))
                    if (await repository.update([item])) {
                        return transform(item)
                    }
                } else {
                    throw new Error("no PasswordReset with this id was found")
                }
            }
        },*/
        resetPassword: {
            type: 'Boolean!',
            args: { email: 'String!' },
            resolve: (obj, { email }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const data = yield dataToModel(container, email);
                let newPasswordReset = repository.parse(data);
                let validation;
                try {
                    validation = yield newPasswordReset.selfValidate();
                }
                catch (e) {
                    console.log(e);
                }
                if (validation.success) {
                    newPasswordReset = (yield repository.insert([newPasswordReset]))[0];
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
                let instance = (yield repository.findByIds([id]))[0];
                let userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
                if (instance.data.secretCode === code) {
                    let rpInstanceData = lodash_1.merge(transform(instance), { state: 'processed' });
                    instance.set(rpInstanceData);
                    let updatedRp = repository.update([instance]);
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
        }
    });
};
