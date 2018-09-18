"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../modules/User");
const Permission_1 = require("../modules/Permission");
exports.default = (app) => {
    User_1.resolvers(app);
    Permission_1.resolvers(app);
};
