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
const index_1 = require("../../index");
exports.default = (app) => {
    app.emitter.on('PERMISSIONS_INIT_DONE', (data) => __awaiter(this, void 0, void 0, function* () {
        const userRepo = app.get(index_1.names.AUTH_USERS_REPOSITORY);
        /*let userConfig = app.config().get('auth').admin
        // check if admin user already exists
        let user = (await userRepo.find({ email: userConfig.email }))[ 0 ]
        // if exists and permissions > 0 then update
        if (user) {
          // if ids then convert them to objects
          const allPermissions = []
          for (let permission of user.data.permissions) {
            if (typeof permission === 'string') {
              let current = newEndpoints.find(p => p.getId() === permission)
              allPermissions.push({
                name: current.name,
                data: {},
              })
            } else {
              allPermissions.push(permission)
            }
          }
          // push the new permissions to allPermissions and then replace in user
          allPermissions.push(...newEndpoints.map(p => {
            return { name: p.name, data: {} }
          }))
          user.set({ permissions: allPermissions })
          userRepo.update([ user ])
            .catch(err => {
              console.log(err)
            })
        } else {
          // if user doesn't exist create it and give it all the permissions
          let userData = {
            email: userConfig.email,
            password: await bcrypt.hash(userConfig.password, 10),
            status: 'active',
            permissions: newEndpoints.map(p => {
              return { name: p.name, data: {} }
            }),
            name: userConfig.name,
          }
          let newUser = userRepo.parse(userData)
          let validation = await newUser.selfValidate()
          if (validation.success) {
            userRepo.insert([ newUser ])
              .catch(err => {
                throw new Error(err)
              })
          } else {
            console.log('something', validation)
          }
          //  send the user data to the specified email
          let transporter: any = app.get(mailNames.MAIL_TRANSPORTER_SERVICE)
          let mailOptions = {
            from: 'admin', // sender address
            to: userConfig.email, // list of receivers
            subject: 'Hassan Kutbi - admin account data', // Subject line
            html: `<h1>Your login data: </h1><br>` +
              `<p>name: ${userConfig.name}</p>` +
              `<p>password: ${userConfig.password}</p>`, // html body
          }
          transporter.sendMail(mailOptions)
            .catch((err: any) => {
              console.log(err)
            })
        }*/
    }));
};
