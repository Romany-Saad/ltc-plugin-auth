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
const schema_1 = require("./schema");
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
    // Queries ===================================
    schema_1.PermissionTC.addResolver({
        name: 'getPermission',
        type: 'Permission!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = yield repository.findByIds([args.id]);
            return (items.length !== 1) ? undefined : transform(items[0]);
        }),
    });
    schema_1.PermissionTC.addResolver({
        name: 'getPermissions',
        type: '[Permission!]!',
        args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const distributionCenters = yield repository.find(args.filter, args.limit, args.skip);
            return distributionCenters.map(transform);
        }),
    });
    schema_1.PermissionTC.addResolver({
        name: 'countPermissions',
        type: 'Int!',
        args: { filter: 'JSON' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            return yield repository.count(args.filter);
        })
    });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ getPermission: schema_1.PermissionTC.getResolver('getPermission') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ getPermissions: schema_1.PermissionTC.getResolver('getPermissions') });
    graphql_compose_1.schemaComposer.rootQuery().addFields({ countPermissions: schema_1.PermissionTC.getResolver('countPermissions') });
    // Mutations ===================================
    /*PermissionTC.addResolver({
        name: 'addPermission',
        type: 'Permission',
        args: {input: 'NewPermission!'},
        resolve: async ({obj, args, context, info}: ResolveParams<App, any>): Promise<any> => {
            const data = dataToModel(args.input)
            let newPermission = repository.parse(data)
            let validation
            try {
                validation = await
                    newPermission.selfValidate()
            } catch (e) {
                console.log(e)
            }
            if (validation.success) {
                newPermission = (await repository.insert([newPermission]))[0]
                return transform(newPermission)
            } else {
                throw new Error(JSON.stringify(validation.errors[0]))
            }
        }
    })*/
    schema_1.PermissionTC.addResolver({
        name: 'deletePermission',
        type: 'Boolean!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const item = (yield repository.findByIds([args.id]));
            if (item && (yield repository.remove(item))) {
                return true;
            }
            else {
                throw new Error("no Permission with this id was found");
            }
        })
    });
    schema_1.PermissionTC.addResolver({
        name: 'enablePermission',
        type: 'Permission!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = (yield repository.findByIds([args.id]));
            if (items.length > 0) {
                const item = items[0];
                const data = lodash_1.merge(transform(items[0]), { protected: true });
                item.set(dataToModel(data));
                if (yield repository.update([item])) {
                    return transform(item);
                }
            }
            else {
                throw new Error("no Permission with this id was found");
            }
        })
    });
    schema_1.PermissionTC.addResolver({
        name: 'disablePermission',
        type: 'Permission!',
        args: { id: 'ID!' },
        resolve: ({ obj, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const items = (yield repository.findByIds([args.id]));
            if (items.length > 0) {
                const item = items[0];
                const data = lodash_1.merge(transform(items[0]), { protected: false });
                item.set(dataToModel(data));
                if (yield repository.update([item])) {
                    return transform(item);
                }
            }
            else {
                throw new Error("no Permission with this id was found");
            }
        })
    });
    // schemaComposer.rootMutation().addFields({addPermission: PermissionTC.getResolver('addPermission')})
    graphql_compose_1.schemaComposer.rootMutation().addFields({ deletePermission: schema_1.PermissionTC.getResolver('deletePermission') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ enablePermission: schema_1.PermissionTC.getResolver('enablePermission') });
    graphql_compose_1.schemaComposer.rootMutation().addFields({ disablePermission: schema_1.PermissionTC.getResolver('disablePermission') });
};
