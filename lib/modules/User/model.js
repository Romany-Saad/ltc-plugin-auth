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
            email: c2v_1.default.str.email(),
            password: c2v_1.default.str,
            status: c2v_1.default.str.in('pending', 'active', 'banned'),
            permissions: c2v_1.default.arr.attach(validators_1.arrayExists(index_1.names.AUTH_PERMISSIONS_REPOSITORY, 'permissions', 'name'))
        });
    }
}
exports.default = default_1;