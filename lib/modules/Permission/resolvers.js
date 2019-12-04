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
    // Queries ===================================
    schema_1.PermissionTC.addResolver({
        name: 'getPermissions',
        type: '[Permission!]!',
        args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
        resolve: ({ source, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const authPlugin = source.getPlugin('cyber-crafts.cms-plugin-auth');
            const permissions = authPlugin.availablePermissions;
            return permissions;
        }),
    });
    schema_1.PermissionTC.addResolver({
        name: 'countPermissions',
        type: 'Int!',
        args: { filter: 'JSON' },
        resolve: ({ source, args, context, info }) => __awaiter(this, void 0, void 0, function* () {
            const authPlugin = source.getPlugin('cyber-crafts.cms-plugin-auth');
            const permissions = authPlugin.availablePermissions;
            return permissions.length;
        }),
    });
    graphql_compose_1.schemaComposer.Query.addFields({ getPermissions: schema_1.PermissionTC.getResolver('getPermissions') });
    graphql_compose_1.schemaComposer.Query.addFields({ countPermissions: schema_1.PermissionTC.getResolver('countPermissions') });
};
