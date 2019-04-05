import App from '@lattice/core'
import { User, Users } from './'
import { merge } from '../../utils'
import { names } from '../../index'
import './schema'
import { ResolveParams, schemaComposer } from 'graphql-compose'
import { IStringKeyedObject } from '@lattice/core/lib/contracts'
import { names as mailNames } from 'ltc-plugin-mail'
import { UserTC } from './schema'
import bcrypt = require('bcrypt')
import jwt = require('jwt-simple')

const RandExp = require('randexp')


const transform = (item: User): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[ item.getIdFieldName() ]
  return obj
}

const dataToModel = (data: any): any => {
  if (data.password) {
    return bcrypt.hash(data.password, 10)
      .then(function (hash) {
        // Store hash in your password DB.
        data.password = hash
        return data
      })
      .catch(err => {
        console.log(err)
      })
  } else {
    return data
  }

}
const resetDataToModel = async (app: App, email: string): Promise<any> => {
  let pr: IStringKeyedObject = {}
  let userRepo = app.get<Users>(names.AUTH_USERS_REPOSITORY)
  let user = (await userRepo.find({ email: email }))[ 0 ]
  pr.userId = user.getId()
  pr.secretCode = new RandExp(/^.{64}$/).gen()
  pr.createdAt = new Date(Date.now())
  pr.state = 'pending'
  return pr
}
export default (container: App): void => {

  const repository = container
    .get<Users>(names.AUTH_USERS_REPOSITORY)

  // const permissionRepo = container
  //   .get<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY)

  const resetRepo = container
    .get<Users>(names.AUTH_PASSWORD_RESET_REPOSITORY)


  // Queries ===================================
  UserTC.addResolver({
    name: 'getUser',
    type: 'User!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = await repository.findByIds([ args.id ])
      return (items.length !== 1) ? undefined : transform(items[ 0 ])
    },
  })
  UserTC.addResolver({
    name: 'getUsers',
    type: '[User!]!',
    args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const users = await repository.find(args.filter, args.limit, args.skip)
      return users.map(transform)
    },
  })
  UserTC.addResolver({
    name: 'countUsers',
    type: 'Int!',
    args: { filter: 'JSON' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      return await repository.count(args.filter)
    },
  })
  UserTC.addResolver({
    name: 'login',
    type: 'AuthedUser!',
    args: { email: 'String!', password: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      let user: any = (await repository.find({ email: args.email }))[ 0 ]
      if (!user) {
        throw new Error('can not find user')
      }
      if (user.data.status === 'banned') {
        throw new Error('This user is banned.')
      }
      /*let permissionsNames: any = await permissionRepo.findByIds(user.data.permissions, 1000)
      if (permissionsNames.length > 0) {
        permissionsNames = permissionsNames.map((permission: any) => {
          return permission.data.name
        })
      }*/
      let serializedUser: IStringKeyedObject = transform(user)
      return bcrypt.compare(args.password, serializedUser.password)
        .then((res: Boolean) => {
          if (res) {
            let token = jwt.encode({ userId: user.getId() }, container.config().get('auth').secret)
            let authedUser: any = {
              id: user.getId(),
              token: token,
              permissions: user.data.permissions,
              email: user.data.email,
            }
            if (user.data.name) {
              authedUser.name = user.data.name
            }
            return authedUser
          } else {
            throw new Error('Invalid credentials.')
          }
        })
    },
  })
  UserTC.addResolver({
    name: 'checkToken',
    type: 'Boolean!',
    args: { token: 'String!' },
    resolve: async ({ source, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      let token = jwt.decode(args.token, container.config().get('auth').secret)
      const user: any[] = await repository.findByIds([ token.userId ])
      if (user.length === 0) {
        return false
      }
      if (user[ 0 ].data.status != 'active') {
        return false
      }
      return !!token
    },
  })

  schemaComposer.rootQuery().addFields({ getUser: UserTC.getResolver('getUser') })
  schemaComposer.rootQuery().addFields({ getUsers: UserTC.getResolver('getUsers') })
  schemaComposer.rootQuery().addFields({ countUsers: UserTC.getResolver('countUsers') })
  schemaComposer.rootQuery().addFields({ login: UserTC.getResolver('login') })
  schemaComposer.rootQuery().addFields({ checkToken: UserTC.getResolver('checkToken') })
  // Mutations ===================================
  UserTC.addResolver({
    name: 'addUser',
    type: 'User',
    args: { input: 'NewUser!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const data = await dataToModel(args.input)
      let defaultPermissions = container.config().get('auth').user.defaultPermissions || []
      data.defaultPermissions = defaultPermissions.length > 0 ? defaultPermissions
        .map((p: any) => {
          return { name: p.data.name, data: {} }
        }) : []
      data.status = 'active'
      let newUser = repository.parse(data)
      let validation = await newUser.selfValidate()
      if (validation.success) {
        newUser = (await repository.insert([ newUser ]))[ 0 ]
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let msg: string = container.config().get('auth.registerMessage')
        if (msg) {
          msg = msg.replace(/<<name>>/, data.name)
        } else {
          msg = `<h3>Welcome ${data.name}, </h3><br> <p>Your registration is successful</p>`
        }
        let mailOptions = {
          from: 'admin', // sender address
          to: data.email, // list of receivers
          subject: 'Hassan Kutbi - Welcome to Arabian drive', // Subject line
          html: msg, // html body
        }
        try {
          await transporter.sendMail(mailOptions)
        } catch (e) {
          console.log(e)
        }
        return transform(newUser)
      } else {
        throw new Error(JSON.stringify(validation.errors[ 0 ]))
      }
    },
  })
  UserTC.addResolver({
    name: 'deleteUser',
    type: 'Boolean!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const item = (await repository.findByIds([ args.id ]))
      if (item && await repository.remove(item)) {
        return true
      } else {
        throw new Error('no User with this id was found')
      }
    },
  })
  UserTC.addResolver({
    name: 'updateUser',
    type: 'User!',
    args: { id: 'ID!', input: 'UserPatch!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = (await repository.findByIds([ args.id ]))
      if (items.length > 0) {
        const item = items[ 0 ]
        const data = merge(transform(items[ 0 ]), args.input)
        item.set(data)
        if (await repository.update([ item ])) {
          return transform(item)
        }
      } else {
        throw new Error('no User with this id was found')
      }
    },
  })
  UserTC.addResolver({
    name: 'changePassword',
    type: 'Boolean!',
    args: { id: 'ID!', oldPassword: 'String!', newPassword: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = (await repository.findByIds([ args.id ]))
      if (items.length > 0) {
        const item: any = items[ 0 ]
        let match = await bcrypt.compare(args.oldPassword, item.data.password)
        if (!match) {
          throw new Error('Invalid credentials.')
        }
        const data = merge(transform(items[ 0 ]), { password: args.newPassword })
        item.set(await dataToModel(data))
        if (await repository.update([ item ])) {
          return true
        }
      } else {
        throw new Error('no User with this id was found')
      }
    },
  })
  UserTC.addResolver({
    name: 'changeEmail',
    type: 'Boolean!',
    args: { id: 'ID!', newEmail: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = (await repository.findByIds([ args.id ]))
      if (items.length > 0) {
        const item = items[ 0 ]
        const data = merge(transform(items[ 0 ]), { email: args.newEmail })
        item.set(data)
        if (await repository.update([ item ])) {
          return true
        }
      } else {
        throw new Error('no User with this id was found')
      }
    },
  })
  UserTC.addResolver({
    name: 'resetPassword',
    type: 'Boolean!',
    args: { email: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const data = await resetDataToModel(container, args.email)
      let newPasswordReset: any = resetRepo.parse(data)
      let validation = await newPasswordReset.selfValidate()
      if (validation.success) {
        newPasswordReset = (await resetRepo.insert([ newPasswordReset ]))[ 0 ]
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let mailOptions = {
          from: 'admin', // sender address
          to: args.email, // list of receivers
          subject: 'Hassan Kutbi - Password reset request', // Subject line
          // html: '<b>Hello world?</b>' // html body
          text: newPasswordReset.secretCode, // html body
        }
        return transporter.sendMail(mailOptions)
          .then((info: any) => {
            if (info.accepted.length > 0) {
              return true
            }
          })
          .catch((err: any) => {
            console.log(err)
            throw new Error('Error sending verification email.')
          })
        // return transform(newPasswordReset)
      } else {
        throw new Error(JSON.stringify(validation.errors[ 0 ]))
      }
    },
  })
  UserTC.addResolver({
    name: 'verifyResetPassword',
    type: 'Boolean!',
    args: { id: 'ID!', code: 'String!', password: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      let instance: any = (await resetRepo.findByIds([ args.id ]))[ 0 ]
      let userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)

      if (instance.data.secretCode === args.code) {
        let rpInstanceData: any = merge(transform(instance), { state: 'processed' })
        instance.set(rpInstanceData)
        let updatedRp = resetRepo.update([ instance ])

        let user: any = (await userRepo.findByIds([ rpInstanceData.userId ]))[ 0 ]
        let newPassword = await bcrypt.hash(args.password, 10)
        let userData: any = merge(transform(user), { password: newPassword })
        user.set(userData)
        let updatedUser = userRepo.update([ user ])
        return Promise.all([ updatedRp, updatedUser ])
          .then(res => {
            return true
          })
          .catch(err => {
            return false
          })
      } else {
        return false
      }
    },
  })
  UserTC.addResolver({
    name: 'register',
    type: 'AuthedUser!',
    args: { input: 'NewUser!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const data = await dataToModel(args.input)
      let defaultPermissions = container.config().get('auth').user.defaultPermissions || []
      data.defaultPermissions = defaultPermissions.length > 0 ? defaultPermissions
        .map((p: any) => {
          return { name: p.data.name, data: {} }
        }) : []
      data.status = 'active'
      let newUser: any = repository.parse(data)
      let validation = await newUser.selfValidate()
      if (validation.success) {
        newUser = (await repository.insert([ newUser ]))[ 0 ]
        let token = jwt.encode({ userId: newUser.getId() }, container.config().get('auth').secret)
        let authedUser: any = {
          id: newUser.getId(),
          token: token,
          permissions: data.permissions,
          email: newUser.data.email,
        }
        if (newUser.data.name) {
          authedUser.name = newUser.data.name
        }
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let msg: string = container.config().get('auth.registerMessage')
        if (msg) {
          msg = msg.replace(/<<name>>/, data.name)
        } else {
          msg = `<h3>Welcome ${data.name}, </h3><br> <p>Your registration is successful</p>`
        }
        let mailOptions = {
          from: 'admin', // sender address
          to: data.email, // list of receivers
          subject: 'Hassan Kutbi - Welcome to Arabian drive', // Subject line
          html: msg, // html body
        }
        try {
          await transporter.sendMail(mailOptions)
        } catch (e) {
          console.log(e)
        }
        return authedUser
      } else {
        throw new Error(JSON.stringify(validation.errors[ 0 ]))
      }
    },
  })

  schemaComposer.rootMutation().addFields({ addUser: UserTC.getResolver('addUser') })
  schemaComposer.rootMutation().addFields({ deleteUser: UserTC.getResolver('deleteUser') })
  schemaComposer.rootMutation().addFields({ updateUser: UserTC.getResolver('updateUser') })
  schemaComposer.rootMutation().addFields({ changePassword: UserTC.getResolver('changePassword') })
  schemaComposer.rootMutation().addFields({ changeEmail: UserTC.getResolver('changeEmail') })
  schemaComposer.rootMutation().addFields({ resetPassword: UserTC.getResolver('resetPassword') })
  schemaComposer.rootMutation().addFields({ verifyResetPassword: UserTC.getResolver('verifyResetPassword') })
  schemaComposer.rootMutation().addFields({ register: UserTC.getResolver('register') })
}
