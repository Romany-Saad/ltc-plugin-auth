"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = (...items) => {
    let result = {};
    for (let item of items) {
        result = Object.assign(Object.assign({}, result), item);
    }
    return result;
};
