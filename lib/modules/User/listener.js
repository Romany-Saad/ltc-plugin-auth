"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ltc_plugin_mail_1 = require("ltc-plugin-mail");
const index_1 = require("../../index");
const utils_1 = require("ltc-plugin-templating/lib/utils");
const bcrypt = require("bcrypt");
exports.default = (app) => {
    app.emitter.on('PERMISSIONS_INIT_DONE', (data) => __awaiter(void 0, void 0, void 0, function* () {
        // adds admin user if it doesn't exist and gives it the proper permissions
        const authPlugin = app.getPlugin('cyber-crafts.cms-plugin-auth');
        const availablePermissions = authPlugin.availablePermissions;
        const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
        let authConfig = app.config().get('auth');
        // check if admin user already exists
        let user = (yield userRepo.find({ email: authConfig.admin.email }))[0];
        // if exists and permissions > 0 then update
        if (user) {
            const allUserPermissions = [];
            for (let permission of user.data.permissions) {
                allUserPermissions.push(permission);
            }
            // push the new permissions to allUserPermissions and then replace in user
            const newPermissions = getPermissionsDiff(availablePermissions, allUserPermissions);
            allUserPermissions.push(...newPermissions.map(p => {
                return { name: p.name, data: {} };
            }));
            user.set({ permissions: allUserPermissions });
            userRepo.update([user])
                .catch(err => {
                console.log(err);
            });
        }
        else {
            // if user doesn't exist create it and give it all the permissions
            let userData = {
                email: authConfig.admin.email,
                password: yield bcrypt.hash(authConfig.admin.password, 10),
                status: 'active',
                permissions: availablePermissions.map(p => {
                    return { name: p.name, data: {} };
                }),
                name: authConfig.admin.name,
            };
            let newUser = userRepo.parse(userData);
            let validation = yield newUser.selfValidate();
            if (validation.success) {
                userRepo.insert([newUser])
                    .catch(err => {
                    throw new Error(err);
                });
            }
            else {
                console.log('error creating admin user', validation);
            }
            //  send the user data to the specified email
            let transporter = app.get(ltc_plugin_mail_1.names.MAIL_TRANSPORTER_SERVICE);
            let emailConfig = authConfig.emails.adminCreated;
            let mailOptions = {
                from: 'admin',
                to: authConfig.admin.email,
                subject: authConfig.adminCreationSubject,
                html: utils_1.render(emailConfig.templatePath, {
                    user: {
                        name: authConfig.admin.name,
                        password: authConfig.admin.password,
                    },
                }),
            };
            transporter.sendMail(mailOptions)
                .catch((err) => {
                console.log(err);
            });
        }
    }));
};
function getPermissionsDiff(set1, set2) {
    return set1.filter(set1Perm => {
        return set2.find(set2Perm => set1Perm.name === set2Perm.name) === undefined;
    });
}
