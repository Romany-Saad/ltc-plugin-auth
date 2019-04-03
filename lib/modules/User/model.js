"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("@lattice/core/lib/abstractions/BaseModel");
const c2v_1 = require("c2v");
const validators_1 = require("ltc-plugin-mongo/lib/validators");
const index_1 = require("../../index");
class default_1 extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        this.schema = c2v_1.default.obj.keys({
            email: c2v_1.default.str.email().attach(validators_1.mongoUnique(index_1.names.AUTH_USERS_REPOSITORY, 'users', 'email', this.getId())),
            password: c2v_1.default.str,
            status: c2v_1.default.str.in('pending', 'active', 'banned'),
            // permissions: c2v.arr.attach(arrayExists(names.AUTH_PERMISSIONS_REPOSITORY, 'permissions', '_id')),
            permissions: c2v_1.default.arr.allItems(c2v_1.default.obj.requires('name', 'data')
                .keys({
                name: c2v_1.default.str,
                data: c2v_1.default.obj
            })),
            name: c2v_1.default.str.maxLength(32).minLength(2),
        });
    }
}
exports.default = default_1;
