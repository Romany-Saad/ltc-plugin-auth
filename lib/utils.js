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
const ltc_core_1 = require("@cyber-crafts/ltc-core");
const index_1 = require("./index");
const passport_google_oauth_1 = require("passport-google-oauth");
const passport_facebook_1 = require("passport-facebook");
const passport = require("passport");
const TwitterStrategy = require('passport-twitter');
const expressSession = require('express-session');
exports.merge = (...items) => {
    let result = {};
    for (let item of items) {
        result = Object.assign({}, result, item);
    }
    return result;
};
const getSocialMediaUser = (app, platform, userData) => __awaiter(this, void 0, void 0, function* () {
    const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
    const emails = userData.emails.map((email) => email.value);
    return (yield userRepo.find({
        $or: [
            {
                email: {
                    $in: emails,
                },
            },
            {
                [`socialMediaData.${platform}.userId`]: userData.id,
            },
        ],
    }))[0];
});
const getNormalizedUserData = (platform, userData) => {
    if (platform === 'twitter') {
        return {
            id: userData.id,
            username: userData.username,
            emails: userData.emails,
            token: userData.token,
            tokenSecret: userData.tokenSecret
        };
    }
    else if (platform === 'google') {
        return {
            id: userData.id,
            username: userData.displayName,
            emails: userData.emails,
            accessToken: userData.accessToken
        };
    }
    else if (platform === 'facebook') {
        return {
            id: userData.id,
            username: userData.displayName,
            emails: userData.emails,
            accessToken: userData.accessToken
        };
    }
};
const generateSocialMediaData = (socialMediaData, platform, userData) => {
    let newData = {
        userId: userData.id,
    };
    if (platform === 'google') {
        newData.accessToken = userData.accessToken;
    }
    else if (platform === 'facebook') {
        newData.accessToken = userData.accessToken;
    }
    else if (platform === 'twitter') {
        newData.token = userData.token;
        newData.tokenSecret = userData.tokenSecret;
    }
    if (socialMediaData && socialMediaData[platform]) {
        const idExists = socialMediaData[platform].findIndex((account) => {
            return account.userId === userData.id;
        });
        if (idExists === -1) {
            socialMediaData[platform].push(newData);
        }
    }
    else {
        if (socialMediaData) {
            socialMediaData[platform] = [newData];
        }
        else {
            socialMediaData = {
                [platform]: [newData],
            };
        }
    }
    return socialMediaData;
};
exports.socialMediaLogin = (container, platform, userData) => __awaiter(this, void 0, void 0, function* () {
    userData = getNormalizedUserData(platform, userData);
    const userRepo = container.get(index_1.names.AUTH_USERS_REPOSITORY);
    // check if user already exists
    const user = yield getSocialMediaUser(container, platform, userData);
    // if email already exists then create a jwt and sent it back
    if (user) {
        let socialMediaData = user.get('socialMediaData');
        socialMediaData = generateSocialMediaData(socialMediaData, platform, userData);
        const authedData = yield helpers_1.loginUser(container, user, platform, socialMediaData);
        if (authedData) {
            return {
                success: true,
                payload: authedData,
            };
        }
        else {
            return {
                success: false,
                msg: 'Error occurred on login.',
            };
        }
    }
    else {
        // if not then register the user and log him in
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
            const socialMediaData = generateSocialMediaData(null, platform, userData);
            const authedData = yield helpers_1.loginUser(container, newUser, platform, socialMediaData);
            if (authedData) {
                return {
                    success: true,
                    payload: authedData,
                };
            }
            else {
                return {
                    success: false,
                    msg: 'Error occurred on login.',
                };
            }
        }
        else {
            return {
                success: false,
                msg: JSON.stringify(validation.errors[0]),
            };
        }
    }
});
exports.initializeSocialMediaLoginPlatforms = (app) => {
    const authConfigs = app.config().get('auth');
    const availablePlatforms = authConfigs.availableLoginPlatforms;
    if (availablePlatforms) {
        // general passport init
        app.emitter.on(ltc_core_1.names.EV_PLUGINS_LOADED, (items) => __awaiter(this, void 0, void 0, function* () {
            passport.serializeUser(function (user, cb) {
                cb(null, user);
            });
            passport.deserializeUser(function (obj, cb) {
                cb(null, obj);
            });
        }));
        // platform specific strategy init
        if (availablePlatforms.indexOf('google') > -1) {
            const googleConfig = authConfigs.google;
            passport.use(new passport_google_oauth_1.OAuth2Strategy({
                clientID: googleConfig.client_id,
                clientSecret: googleConfig.client_secret,
                callbackURL: '/oauth/callback?platform=google',
            }, function (accessToken, refreshToken, profile, cb) {
                profile.accessToken = accessToken;
                return cb(null, profile);
            }));
        }
        if (availablePlatforms.indexOf('facebook') > -1) {
            const facebookConfig = authConfigs.facebook;
            passport.use(new passport_facebook_1.Strategy({
                clientID: facebookConfig.appId,
                clientSecret: facebookConfig.appSecret,
                callbackURL: '/oauth/callback?platform=facebook',
                profileFields: ['id', 'displayName', 'email'],
            }, function (accessToken, refreshToken, profile, cb) {
                profile.accessToken = accessToken;
                return cb(null, profile);
            }));
        }
        if (availablePlatforms.indexOf('twitter') > -1) {
            const twitterConfig = authConfigs.twitter;
            passport.use(new TwitterStrategy({
                consumerKey: twitterConfig.consumerKey,
                consumerSecret: twitterConfig.consumerSecret,
                userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
                callbackURL: `/oauth/callback?platform=twitter`,
            }, function (token, tokenSecret, profile, cb) {
                profile.token = token;
                profile.tokenSecret = tokenSecret;
                return cb(null, profile);
            }));
        }
    }
};
