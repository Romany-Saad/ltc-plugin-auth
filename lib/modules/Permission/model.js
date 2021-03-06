"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("@cyber-crafts/ltc-core/lib/abstractions/BaseModel");
const c2v_1 = require("c2v");
class default_1 extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        this.schema = c2v_1.default.obj
            .requires('name', 'endpoint', 'protected', 'type')
            .keys({
            name: c2v_1.default.str.minLength(2).maxLength(128),
            endpoint: c2v_1.default.str,
            protected: c2v_1.default.bool,
            type: c2v_1.default.str.in('query', 'mutation', 'subscription', 'rest'),
        });
    }
}
exports.default = default_1;
