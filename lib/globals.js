"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.rootPath = (relativePath) => path.resolve(__dirname, '../', relativePath);
