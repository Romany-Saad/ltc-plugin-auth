import { names as mailNames } from 'ltc-plugin-mail'
import App from '@lattice/core/lib/App'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { names } from '../../index'
import bcrypt = require('bcrypt')
import IPermission from '../../contracts/IPermission'
import { assertValidExecutionArguments } from 'graphql/execution/execute'


export default (app: App) => {
  app.emitter.on('PERMISSIONS_INIT_DONE', async (data) => {
    // adds admin user if it doesn't exist and gives it the proper permissions
    const authPlugin: any = app.getPlugin('cyber-crafts.cms-plugin-auth')
    const availablePermissions: IPermission[] = authPlugin.availablePermissions

    const userRepo = app.get<AMongoDbRepository<any>>(names.AUTH_USERS_REPOSITORY)
    let userConfig = app.config().get('auth').admin
    // check if admin user already exists
    let user = (await userRepo.find({ email: userConfig.email }))[ 0 ]
    // if exists and permissions > 0 then update
    if (user) {
      const allUserPermissions = []
      for (let permission of user.data.permissions) {
        allUserPermissions.push(permission)
      }
      // push the new permissions to allUserPermissions and then replace in user
      const newPermissions = getPermissionsDiff(availablePermissions, allUserPermissions)
      allUserPermissions.push(...newPermissions.map(p => {
        return { name: p.name, data: {} }
      }))
      user.set({ permissions: allUserPermissions })
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
        permissions: availablePermissions.map(p => {
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
        console.log('error creating admin user', validation)
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
    }
  })
}

function getPermissionsDiff (set1: Array<any>, set2: Array<any>) {
  return set1.filter(set1Perm => {
    return set2.find(set2Perm => set1Perm.name === set2Perm.name) === undefined
  })
}