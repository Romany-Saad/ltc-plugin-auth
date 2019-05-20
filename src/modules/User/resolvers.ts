import App from '@lattice/core'
import { User, Users } from './'
import { merge } from '../../utils'
import { names } from '../../index'
import './schema'
import { ResolveParams, schemaComposer } from 'graphql-compose'
import { IStringKeyedObject } from '@lattice/core/lib/contracts'
import { names as mailNames } from 'ltc-plugin-mail'
import { UserTC } from './schema'
import { render } from 'ltc-plugin-templating/lib/utils'
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
const resetDataToModel = async (user: any): Promise<any> => {
  let pr: IStringKeyedObject = {}
  pr.userId = user.getId()
  pr.secretCode = new RandExp(/^[a-z0-9]{8}$/).gen()
  pr.createdAt = new Date(Date.now())
  pr.state = 'pending'
  return pr
}

const getAuthedUser = (app: App, user: any) => {
  const authConfig = app.config().get('auth')
  let token = jwt.encode({ userId: user.getId() }, authConfig.secret)
  let permissions = user.get('permissions').map((p: any) => {
    return {
      name: p.name,
      data: p.data,
    }
  })
  const defaultPermissions = authConfig.user.defaultPermissions
  const roles = authConfig.roles
  if (defaultPermissions) {
    permissions.push(...defaultPermissions.map((p: any) => {
      return {
        name: p.name,
        data: p.data,
      }
    }))
  }
  if (user.get('roles')) {
    for (let role of user.get('roles')) {
      let currentRole = roles.find((configRole: any) => configRole.name === role)
      if (currentRole) {
        currentRole.permissions.forEach((p: any) => {
          permissions.push({
            name: p.name,
            data: p.data,
          })
        })
      }
    }
  }
  let authedUser: any = {
    id: user.getId(),
    token: token,
    permissions: permissions,
    email: user.get('email'),
  }
  if (user.get('name')) {
    authedUser.name = user.get('name')
  }
  return authedUser
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
      let serializedUser: IStringKeyedObject = transform(user)
      return bcrypt.compare(args.password, serializedUser.password)
        .then((res: Boolean) => {
          if (res) {
            return getAuthedUser(container, user)
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

  UserTC.addResolver({
    name: 'getRoles',
    type: '[UserRole]!',
    resolve: async ({ source, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const roles = source.config().get('auth.roles')
      return roles || []
    },
  })

  schemaComposer.rootQuery().addFields({ getUser: UserTC.getResolver('getUser') })
  schemaComposer.rootQuery().addFields({ getUsers: UserTC.getResolver('getUsers') })
  schemaComposer.rootQuery().addFields({ countUsers: UserTC.getResolver('countUsers') })
  schemaComposer.rootQuery().addFields({ login: UserTC.getResolver('login') })
  schemaComposer.rootQuery().addFields({ checkToken: UserTC.getResolver('checkToken') })
  schemaComposer.rootQuery().addFields({ getRoles: UserTC.getResolver('getRoles') })


  // Mutations ===================================
  UserTC.addResolver({
    name: 'addUser',
    type: 'User',
    args: { input: 'NewUser!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const data = await dataToModel(args.input)
      data.permissions = []
      data.status = 'active'
      let newUser = repository.parse(data)
      let validation = await newUser.selfValidate()
      if (validation.success) {
        newUser = (await repository.insert([ newUser ]))[ 0 ]
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let emailConfig: any = container.config().get('auth.emails.addUser')
        let mailOptions = {
          from: 'admin', // sender address
          to: data.email, // list of receivers
          subject: emailConfig.subject, // Subject line
          html: render(emailConfig.templatePath, {
            user: {
              name: data.name,
            },
          }), // html body
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
    resolve: async ({ source, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const authConfig = container.config().get('auth')
      let userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)
      let user = (await userRepo.find({ email: args.email }))[ 0 ]
      if (!user) {
        throw new Error('Invalid email.')
      }
      const data = await resetDataToModel(user)
      let newPasswordReset: any = resetRepo.parse(data)
      let validation = await newPasswordReset.selfValidate()
      if (validation.success) {
        newPasswordReset = (await resetRepo.insert([ newPasswordReset ]))[ 0 ]
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let emailConfig: any = container.config().get('auth.emails.resetPassword')
        let mailOptions = {
          from: 'admin', // sender address
          to: args.email, // list of receivers
          subject: emailConfig.subject, // Subject line
          html: render(emailConfig.templatePath, {
            user: {
              name: user.get('name'),
              secretCode: newPasswordReset.get('secretCode'),
              resetId: newPasswordReset.getId(),
            },
            host: container.config().get('http.clientUrl'),
          }), // html body
          // text: newPasswordReset.get('secretCode'), // html body
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
    args: { code: 'String!', password: 'String!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      let instance: any = (await resetRepo.find({ secretCode: args.code }))[ 0 ]
      if (!instance) {
        throw new Error('Invalid code')
      }
      const timeLimit = new Date(instance.get('createdAt'))
      timeLimit.setMinutes(timeLimit.getMinutes() + 10)
      if (new Date(timeLimit) < new Date()) {
        throw new Error('secret code time out.')
      }
      const userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)
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
    },
  })
  UserTC.addResolver({
    name: 'register',
    type: 'AuthedUser!',
    args: { input: 'Register!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const authConfig = container.config().get('auth')
      const data = await dataToModel(args.input)
      data.permissions = []
      data.status = 'active'
      let newUser: any = repository.parse(data)
      let validation = await newUser.selfValidate()
      if (validation.success) {
        delete newUser.data.grecaptchaToken
        newUser = (await repository.insert([ newUser ]))[ 0 ]
        let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
        let emailConfig: any = container.config().get('auth.emails.register')
        let mailOptions = {
          from: 'admin', // sender address
          to: data.email, // list of receivers
          subject: emailConfig.subject, // Subject line
          html: render(emailConfig.templatePath, {
            user: {
              name: data.name,
            },
          }), // html body
        }
        try {
          await transporter.sendMail(mailOptions)
        } catch (e) {
          console.log(e)
        }
        return getAuthedUser(container, newUser)
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
