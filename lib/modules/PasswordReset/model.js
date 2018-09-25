"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("@lattice/core/lib/abstractions/BaseModel");
const c2v_1 = require("c2v");
const validators_1 = require("ltc-plugin-mongo/lib/validators");
const index_1 = require("../../index");
class default_1 extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        this.schema = c2v_1.default.obj
            .requires('userId', 'secretCode', 'createdAt', 'state')
            .keys({
            userId: c2v_1.default.str.attach(validators_1.mongoExists(index_1.names.AUTH_USERS_REPOSITORY, 'users', '_id')),
            secretCode: c2v_1.default.str.minLength(64),
            createdAt: c2v_1.default.date,
            state: c2v_1.default.str.in('pending', 'processed')
        });
    }
}
exports.default = default_1;
