"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AMongoDbRepository_1 = require("ltc-plugin-mongo/lib/abstractions/AMongoDbRepository");
const index_1 = require("./index");
class default_1 extends AMongoDbRepository_1.default {
    constructor(client, collectionName) {
        super(client, collectionName);
    }
    parse(data) {
        return new index_1.Permission(data);
    }
}
exports.default = default_1;
