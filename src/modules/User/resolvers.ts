import App from "@lattice/core/lib/App"
import { GraphQLResolveInfo } from "graphql"
import { IModel } from "@lattice/core/lib/contracts"
import { User, Users } from "./"
import { merge } from "lodash"
import { names } from "../../index"
import './schema'
import { schemaComposer } from 'graphql-compose'
import bcrypt = require('bcrypt')
import { IStringKeyedObject } from "@lattice/core/lib/contracts"
import jwt = require('jwt-simple')
import { names as mailNames } from "ltc-plugin-mail"
const RandExp = require('randexp')


const transform = (item: User): object => {
    const obj = item.serialize()
    obj.id = item.getId()
    delete obj[item.getIdFieldName()]
    return obj
}

const dataToModel = (data: any): any => {
    if (data.hasOwnProperty('password')) {
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
    let user = (await userRepo.find({email: email}))[0]
    pr.userId = user.getId()
    pr.secretCode = new RandExp(/^.{64}$/).gen()
    pr.createdAt = new Date(Date.now())
    pr.state = 'pending'
    return pr
}
export default (container: App): void => {

    const repository = container
        .get<Users>(names.AUTH_USERS_REPOSITORY)

    const resetRepo = container
        .get<Users>(names.AUTH_PASSWORD_RESET_REPOSITORY)

    schemaComposer.Query.addFields({
        getUser: {
            type: 'User!',
            args: {id: 'ID!'},
            resolve: async (obj: any, {id}): Promise<any> => {
                const items = await repository.findByIds([id])
                return (items.length !== 1) ? undefined : transform(items[0])
            },
        },
        getUsers: {
            type: '[User!]!',
            args: {skip: 'Int', limit: 'Int', filter: 'JSON'},
            resolve: async (obj, {skip, limit, filter}): Promise<any> => {
                const users = await repository.find(filter, limit, skip)
                return users.map(transform)
            },
        },
        countUsers: {
            type: 'Int!',
            args: {filter: 'JSON'},
            resolve: async (obj, {filter}): Promise<any> => {
                return await repository.count(filter)
            }
        },
        login: {
            type: 'AuthedUser!',
            args: {email: 'String!', password: 'String!'},
            resolve: async (obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                let user: any = (await repository.find({email: args.email}))[0]
                let serializedUser: IStringKeyedObject = transform(user)
                return bcrypt.compare(args.password, serializedUser.password)
                    .then((res: Boolean) => {
                        if (res) {
                            let token = jwt.encode({userID: user.getId()}, 'LTC_SECRET')
                            let authedUser: any = {
                                id: user.getId(),
                                token: token,
                                authorization: serializedUser.permissions
                            }
                            if(user.data.name) {
                                authedUser.name = user.data.name
                            }
                            return authedUser
                        } else {
                            throw new Error('Invalid credentials.')
                        }
                    })
            }
        }

    })

    schemaComposer.Mutation.addFields({
        addUser: {
            type: 'User',
            args: {input: 'NewUser!'},
            resolve: async (obj: any, {input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const data = await dataToModel(input)
                data.permissions = []
                data.status = 'active'
                let newUser = repository.parse(data)
                let validation
                try {
                    validation = await
                        newUser.selfValidate()
                } catch (e) {
                    console.log(e)
                }
                if (validation.success) {
                    newUser = (await repository.insert([newUser]))[0]
                    return transform(newUser)
                } else {
                    throw new Error(JSON.stringify(validation.errors[0]))
                }
            }
        },
        deleteUser: {
            type: 'Boolean!',
            args: {id: 'ID!'},
            resolve: async (obj: any, {id}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const item = (await repository.findByIds([id]))
                if (item && await repository.remove(item)) {
                    return true
                } else {
                    throw new Error("no User with this id was found")
                }
            }
        },
        /*updateUser: {
            type: 'User!',
            args: {id: 'ID!', input: 'UserPatch!'},
            resolve: async (obj: any, {id, input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), input)
                    item.set(await dataToModel(data))
                    if (await repository.update([item])) {
                        return transform(item)
                    }
                } else {
                    throw new Error("no User with this id was found")
                }
            }
        },*/
        updateUser: {
            type: 'User!',
            args: {id: 'ID!', input: 'UserPatch!'},
            resolve: async (obj: any, {id, input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), input)
                    item.set(await dataToModel(data))
                    if (await repository.update([item])) {
                        return transform(item)
                    }
                } else {
                    throw new Error("no User with this id was found")
                }
            }
        },
        changePassword: {
            type: 'Boolean!',
            args: {id: 'ID!', newPassword: 'String!'},
            resolve: async (obj: any, {id, newPassword}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), {password: newPassword})
                    item.set(await dataToModel(data))
                    if (await repository.update([item])) {
                        return true
                    }
                } else {
                    throw new Error("no User with this id was found")
                }
            }
        },
        changeEmail: {
            type: 'Boolean!',
            args: {id: 'ID!', newEmail: 'String!'},
            resolve: async (obj: any, {id, newEmail}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), {email: newEmail})
                    item.set(await dataToModel(data))
                    if (await repository.update([item])) {
                        return true
                    }
                } else {
                    throw new Error("no User with this id was found")
                }
            }
        },
        resetPassword: {
            type: 'Boolean!',
            args: {email: 'String!'},
            resolve: async (obj: any, {email}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const data = await resetDataToModel(container, email)
                let newPasswordReset: any = resetRepo.parse(data)
                let validation
                try {
                    validation = await
                        newPasswordReset.selfValidate()
                } catch (e) {
                    console.log(e)
                }
                if (validation.success) {
                    newPasswordReset = (await resetRepo.insert([newPasswordReset]))[0]
                    let transporter: any = container.get(mailNames.MAIL_TRANSPORTER_SERVICE)
                    let mailOptions = {
                        from: 'admin', // sender address
                        to: email, // list of receivers
                        subject: 'Hassan Kutbi - Password reset request', // Subject line
                        // html: '<b>Hello world?</b>' // html body
                        text: newPasswordReset.secretCode // html body
                    }
                    return transporter.sendMail(mailOptions)
                        .then((info: any) => {
                            if (info.accepted.length > 0) {
                                return true
                            }
                        })
                        .catch((err: any) => {
                            throw new Error('Error sending verification email.')
                        })
                    // return transform(newPasswordReset)
                } else {
                    throw new Error(JSON.stringify(validation.errors[0]))
                }
            }
        },
        verifyResetPassword: {
            type: 'Boolean!',
            args: {id: 'ID!', code: 'String!', password: 'String!'},
            resolve: async (obj: any, {id, code, password}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                let instance: any = (await resetRepo.findByIds([id]))[0]
                let userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)

                if (instance.data.secretCode === code) {
                    let rpInstanceData: any = merge(transform(instance), {state: 'processed'})
                    instance.set(rpInstanceData)
                    let updatedRp = resetRepo.update([instance])

                    let user: any = (await userRepo.findByIds([rpInstanceData.userId]))[0]
                    let newPassword  = await bcrypt.hash(password, 10)
                    let userData: any = merge(transform(user), {password: newPassword})
                    user.set(userData)
                    let updatedUser = userRepo.update([user])
                    return Promise.all([updatedRp, updatedUser])
                        .then(res => {
                            return true
                        })
                        .catch(err => {
                            return false
                        })
                } else {
                    return false
                }
            }
        },
        register: {
            type: 'AuthedUser',
            args: {input: 'NewUser!'},
            resolve: async (obj: any, {input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const data = await dataToModel(input)
                data.permissions = []
                data.status = 'active'
                let newUser: any = repository.parse(data)
                let validation
                try {
                    validation = await
                        newUser.selfValidate()
                } catch (e) {
                    console.log(e)
                }
                if (validation.success) {
                    newUser = (await repository.insert([newUser]))[0]
                    let token = jwt.encode({userID: newUser.getId()}, 'LTC_SECRET')
                    let authedUser: any = {
                        id: newUser.getId(),
                        token: token,
                        authorization: newUser.data.permissions
                    }
                    if(newUser.data.name) {
                        authedUser.name = newUser.data.name
                    }
                    return authedUser
                } else {
                    throw new Error(JSON.stringify(validation.errors[0]))
                }
            }
        },
    })
}
