"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
require("./schema");
const transform = (item) => {
    const obj = item.serialize();
    obj.id = item.getId();
    delete obj[item.getIdFieldName()];
    return obj;
};
exports.default = (container) => {
    const repository = container
        .get(index_1.names.AUTH_PASSWORD_RESET_REPOSITORY);
    /*schemaComposer.Mutation.addFields({

    })*/
};
