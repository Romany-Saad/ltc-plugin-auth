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
// Queries ===================================
schema_1.RoleTC.addResolver({
    name: 'getRole',
    type: 'Role',
    args: { id: 'ID!' },
    resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
        const repository = source.get(index_1.names.AUTH_ROLES_REPOSITORY);
        const items = yield repository.findByIds([args.id]);
        return (items.length !== 1) ? undefined : transform(items[0]);
    }),
});
schema_1.RoleTC.addResolver({
    name: 'getRoles',
    type: 'Roles!',
    args: { skip: 'Int', limit: 'Int', sort: 'JSON', filter: 'JSON' },
    resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
        const repository = source.get(index_1.names.AUTH_ROLES_REPOSITORY);
        const Roles = yield repository.find(args.filter, args.limit, args.skip, args.sort);
        return {
            items: Roles.map(transform),
            app: source,
        };
    }),
});
graphql_compose_1.schemaComposer.getOTC('Roles')
    .setField('totalCount', {
    type: 'Int!',
    resolve: (source, args, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const app = source.app;
        const repository = app.get(index_1.names.AUTH_ROLES_REPOSITORY);
        return yield repository.count(args.filter);
    }),
});
graphql_compose_1.schemaComposer.Query.addFields({ getRole: schema_1.RoleTC.getResolver('getRole') });
graphql_compose_1.schemaComposer.Query.addFields({ getRoles: schema_1.RoleTC.getResolver('getRoles') });
// Mutations ===================================
schema_1.RoleTC.addResolver({
    name: 'addRole',
    type: 'Role',
    args: { input: 'NewRole!' },
    resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
        const repository = source.get(index_1.names.AUTH_ROLES_REPOSITORY);
        const data = dataToModel(args.input);
        let newRole = repository.parse(data);
        let validation = yield newRole.selfValidate();
        if (validation.success) {
            newRole = (yield repository.insert([newRole]))[0];
            return transform(newRole);
        }
        else {
            throw new Error(JSON.stringify(validation.errors[0]));
        }
    }),
});
schema_1.RoleTC.addResolver({
    name: 'updateRole',
    type: 'Role!',
    args: { id: 'ID!', input: 'RolePatch!' },
    resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
        const repository = source.get(index_1.names.AUTH_ROLES_REPOSITORY);
        const items = (yield repository.findByIds([args.id]));
        if (items.length > 0) {
            const item = items[0];
            const data = utils_1.merge(transform(items[0]), args.input);
            item.set(dataToModel(data));
            let validation = yield item.selfValidate();
            if (!validation.success) {
                throw new Error(JSON.stringify(validation.errors[0]));
            }
            if (yield repository.update([item])) {
                return transform(item);
            }
        }
        else {
            throw new Error('no Role with this id was found');
        }
    }),
});
schema_1.RoleTC.addResolver({
    name: 'deleteRole',
    type: 'Boolean!',
    args: { id: 'ID!' },
    resolve: ({ source, args, context, info }) => __awaiter(void 0, void 0, void 0, function* () {
        const repository = source.get(index_1.names.AUTH_ROLES_REPOSITORY);
        const item = (yield repository.findByIds([args.id]));
        if (item && (yield repository.remove(item))) {
            return true;
        }
        else {
            throw new Error('no Role with this id was found');
        }
    }),
});
graphql_compose_1.schemaComposer.Mutation.addFields({ addRole: schema_1.RoleTC.getResolver('addRole') });
graphql_compose_1.schemaComposer.Mutation.addFields({ updateRole: schema_1.RoleTC.getResolver('updateRole') });
graphql_compose_1.schemaComposer.Mutation.addFields({ deleteRole: schema_1.RoleTC.getResolver('deleteRole') });
