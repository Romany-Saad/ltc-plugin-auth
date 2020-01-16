"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("@cyber-crafts/ltc-core/lib/abstractions/BaseModel");
const c2v_1 = require("c2v");
const validators_1 = require("ltc-plugin-mongo/lib/validators");
const index_1 = require("../../index");
class Role extends BaseModel_1.default {
    get schema() {
        return this.generateSchema();
    }
    set schema(schema) {
        this._schema = schema;
    }
    generateSchema() {
        let schema = c2v_1.default.obj
            .requires('name', 'permissions')
            .keys({
            name: c2v_1.default.str.addRule({
                name: 'unique-name',
                func: validators_1.mongoUnique(index_1.names.AUTH_ROLES_REPOSITORY, 'roles', 'name', this.getId()),
            }),
            permissions: c2v_1.default.arr.minItems(1).allItems(c2v_1.default.obj.requires('name')
                .keys({
                name: c2v_1.default.str,
                data: c2v_1.default.obj,
            })),
            description: c2v_1.default.str,
        });
        return schema;
    }
}
exports.default = Role;
