"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jwt-simple");
class Auth {
    constructor(container, authorizaionHeader) {
        this.app = container;
        console.log(container.config().get('auth').secret);
        this.authorizationData = jwt.decode(this.getTokenFromHeader(authorizaionHeader), container.config().get('auth').secret);
    }
    getTokenFromHeader(token) {
        return token.match(/Bearer (.+)/)[1];
    }
    getAuthedUser() {
        return this.authorizationData;
    }
}
exports.default = Auth;
