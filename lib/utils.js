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
const helpers_1 = require("./modules/User/helpers");
const index_1 = require("./index");
exports.merge = (...items) => {
    let result = {};
    for (let item of items) {
        result = Object.assign({}, result, item);
    }
    return result;
};
exports.socialMediaLogin = (container) => (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    // TODO: this needs to be more modular
    const reqUser = req.user;
    const userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
    // check if user already exists
    const emails = reqUser.emails.map((email) => email.value);
    const user = (yield userRepo.find({
        $or: [
            {
                email: {
                    $in: emails,
                },
            },
            {
                'socialMediaData.twitter.userId': reqUser.id,
            },
        ],
    }))[0];
    // if email already exists then create a jwt and sent it back
    if (user) {
        let socialMediaData = user.get('socialMediaData');
        if (socialMediaData && socialMediaData.twitter) {
            const idExists = socialMediaData.twitter.findIndex((account) => {
                return account.userId === reqUser.id;
            });
            if (idExists === -1) {
                socialMediaData.twitter.push({
                    userId: reqUser.id,
                });
            }
        }
        else {
            if (socialMediaData) {
                socialMediaData.twitter = [{
                        userId: reqUser.id,
                    }];
            }
            else {
                socialMediaData = {
                    twitter: [{
                            userId: reqUser.id,
                        }],
                };
            }
        }
        const authedData = yield helpers_1.loginUser(container, user, 'twitter', socialMediaData);
        if (authedData) {
            console.log(`[authed from user] ${authedData}`);
            return res.json(authedData);
        }
        else {
            return next('Error occurred on login.');
        }
    }
    else {
        // if not then register the user and log him in
        console.log(reqUser.emails);
        const newUserData = {
            email: reqUser.emails[0].value,
            status: 'active',
            name: reqUser.username,
            permissions: [],
        };
        let newUser = userRepo.parse(newUserData);
        const validation = yield newUser.selfValidate();
        if (validation.success) {
            newUser = (yield userRepo.insert([newUser]))[0];
            const authedData = yield helpers_1.loginUser(container, newUser, 'twitter', {
                twitter: [{
                        userId: reqUser,
                    }],
            });
            if (authedData) {
                console.log(`[authed from clean] ${authedData}`);
                return res.json(authedData);
            }
            else {
                return next('Error occurred on login.');
            }
        }
        else {
            console.log(JSON.stringify(validation.errors));
            return next(JSON.stringify(validation.errors[0]));
        }
    }
});
