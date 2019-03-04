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
const AMongoDbRepository_1 = require("ltc-plugin-mongo/lib/abstractions/AMongoDbRepository");
const index_1 = require("./index");
class default_1 extends AMongoDbRepository_1.default {
    parse(data) {
        return new index_1.Permission(data);
    }
    setNameIndex() {
        this.client.db().collections()
            .then(collections => {
            const collectionsNames = collections.map(c => c.collectionName);
            if (collectionsNames.indexOf('permissions') > -1) {
                this.collection.indexExists('permission.name')
                    .then((bool) => __awaiter(this, void 0, void 0, function* () {
                    if (!bool) {
                        this.collection.createIndexes([{
                                name: 'permission.name',
                                key: { 'name': 1 },
                                unique: true,
                            }])
                            .catch(err => {
                            console.log(err);
                        });
                    }
                }));
            }
        });
    }
    constructor(client, collectionName) {
        super(client, collectionName);
        this.setNameIndex();
    }
}
exports.default = default_1;
