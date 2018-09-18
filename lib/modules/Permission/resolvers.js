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
const transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
const dataToModel = (data) => {
    return data;
};
exports.default = (container) => {
    const repository = container
        .get(index_1.names.AUTH_PERMISSIONS_REPOSITORY);
    graphql_compose_1.schemaComposer.Query.addFields({
        getPermission: {
            type: 'Permission!',
            args: { id: 'ID!' },
            resolve: (obj, { id }) => __awaiter(this, void 0, void 0, function* () {
                const items = yield repository.findByIds([id]);
                return (items.length !== 1) ? undefined : transform(items[0]);
            }),
        },
        getPermissions: {
            type: '[Permission!]!',
            args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
            resolve: (obj, { skip, limit, filter }) => __awaiter(this, void 0, void 0, function* () {
                const distributionCenters = yield repository.find(filter, limit, skip);
                return distributionCenters.map(transform);
            }),
        },
        countPermissions: {
            type: 'Int!',
            args: { filter: 'JSON' },
            resolve: (obj, { filter }) => __awaiter(this, void 0, void 0, function* () {
                return yield repository.count(filter);
            })
        }
    });
    graphql_compose_1.schemaComposer.Mutation.addFields({
        addPermission: {
            type: 'Permission',
            args: { input: 'NewPermission!' },
            resolve: (obj, { input }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const data = dataToModel(input);
                let newPermission = repository.parse(data);
                let validation;
                try {
                    validation = yield newPermission.selfValidate();
                }
                catch (e) {
                    console.log(e);
                }
                if (validation.success) {
                    newPermission = (yield repository.insert([newPermission]))[0];
                    return transform(newPermission);
                }
                else {
                    throw new Error(JSON.stringify(validation.errors[0]));
                }
            })
        },
        deletePermission: {
            type: 'Boolean!',
            args: { id: 'ID!' },
            resolve: (obj, { id }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const item = (yield repository.findByIds([id]));
                if (item && (yield repository.remove(item))) {
                    return true;
                }
                else {
                    throw new Error("no Permission with this id was found");
                }
            })
        },
        updatePermission: {
            type: 'Permission!',
            args: { id: 'ID!', input: 'PermissionPatch!' },
            resolve: (obj, { id, input }, context, info) => __awaiter(this, void 0, void 0, function* () {
                const items = (yield repository.findByIds([id]));
                if (items.length > 0) {
                    const item = items[0];
                    const data = lodash_1.merge(transform(items[0]), input);
                    item.set(dataToModel(data));
                    if (yield repository.update([item])) {
                        return transform(item);
                    }
                }
                else {
                    throw new Error("no Permission with this id was found");
                }
            })
        }
    });
};
