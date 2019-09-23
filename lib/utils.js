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
const getSocialMediaUser = (app, platform, userData) => __awaiter(this, void 0, void 0, function* () {
    const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    if (platform === 'twitter') {
        const emails = userData.emails.map((email) => email.value);
        return (yield userRepo.find({
            $or: [
                {
                    email: {
                        $in: emails,
                    },
                },
                {
                    'socialMediaData.twitter.userId': userData.id,
                },
            ],
        }))[0];
    }
    else {
        if (platform === 'google') {
            const emails = userData.emails.map((email) => email.value);
            return (yield userRepo.find({
                $or: [
                    {
                        email: {
                            $in: emails,
                        },
                    },
                    {
                        'socialMediaData.google.userId': userData.id,
                    },
                ],
            }))[0];
        }
    }
});
const getNormalizedUserData = (platform, userData) => {
    if (platform === 'twitter') {
        return {
            id: userData.id,
            username: userData.username,
            emails: userData.emails
        };
    }
    else if (platform === 'google') {
        return {
            id: userData.id,
            username: userData.displayName,
            emails: userData.emails
        };
    }
    else if (platform === 'facebook') {
        return {
            id: userData.id,
            username: userData.displayName,
            emails: userData.emails
        };
    }
};
//TODO: change res and next params
exports.socialMediaLogin = (container, platform, userData, res, next) => __awaiter(this, void 0, void 0, function* () {
    // TODO: this needs to be more modular
    console.log(platform);
    // if (platform === 'facebook') {
    //   res.send(userData)
    // }
    userData = getNormalizedUserData(platform, userData);
    const userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
    // check if user already exists
    const user = yield getSocialMediaUser(container, platform, userData);
    // if email already exists then create a jwt and sent it back
    if (user) {
        let socialMediaData = user.get('socialMediaData');
        if (socialMediaData && socialMediaData[platform]) {
            const idExists = socialMediaData[platform].findIndex((account) => {
                return account.userId === userData.id;
            });
            if (idExists === -1) {
                // TODO: change this to take dynamic data
                socialMediaData[platform].push({
                    userId: userData.id,
                });
            }
        }
        else {
            if (socialMediaData) {
                socialMediaData[platform] = [{
                        userId: userData.id,
                    }];
            }
            else {
                socialMediaData = {
                    [platform]: [{
                            userId: userData.id,
                        }],
                };
            }
        }
        const authedData = yield helpers_1.loginUser(container, user, platform, socialMediaData);
        if (authedData) {
            return res.json(authedData);
        }
        else {
            return next('Error occurred on login.');
        }
    }
    else {
        // if not then register the user and log him in
        console.log(userData.emails);
        const newUserData = {
            email: userData.emails[0].value,
            status: 'active',
            name: userData.username,
            permissions: [],
        };
        let newUser = userRepo.parse(newUserData);
        const validation = yield newUser.selfValidate();
        if (validation.success) {
            newUser = (yield userRepo.insert([newUser]))[0];
            const authedData = yield helpers_1.loginUser(container, newUser, platform, {
                [platform]: [{
                        userId: userData,
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
