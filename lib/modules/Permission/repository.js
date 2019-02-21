"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AMongoDbRepository_1 = require("ltc-plugin-mongo/lib/abstractions/AMongoDbRepository");
const index_1 = require("./index");
class default_1 extends AMongoDbRepository_1.default {
    parse(data) {
        return new index_1.Permission(data);
    }
    setNameIndex() {
        this.collection.indexExists('permission.name')
            .then(bool => {
            if (!bool) {
                this.collection.createIndexes([{
                        name: 'permission.name',
                        key: { name: 1 },
                        unique: true,
                    }])
                    .catch(err => {
                    console.log(err);
                });
            }
        });
    }
    constructor(client, collectionName) {
        super(client, collectionName);
        this.setNameIndex();
    }
}
exports.default = default_1;
