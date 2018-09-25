import App from "@lattice/core/lib/App"
import { GraphQLResolveInfo, responsePathAsArray } from "graphql"
import { IModel, IStringKeyedObject } from "@lattice/core/lib/contracts"
import { PasswordReset, PasswordResets } from "./"
import { merge } from "lodash"
import { names } from "../../index"
import './schema'
import { schemaComposer } from 'graphql-compose'
import bcrypt = require('bcrypt')

const RandExp = require('randexp')
import { names as mailNames } from "ltc-plugin-mail"
import { Users } from "../User"

const transform = (item: any): object => {
    const obj = item.serialize()
    obj.id = item.getId()
    delete obj[item.getIdFieldName()]
    return obj
}

const dataToModel = async (app: App, email: string): Promise<any> => {
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
        .get<PasswordResets>(names.AUTH_PASSWORD_RESET_REPOSITORY)

    schemaComposer.Query.addFields({
        getPasswordReset: {
            type: 'PasswordReset!',
            args: {id: 'ID!'},
            resolve: async (obj: any, {id}): Promise<any> => {
                const items = await repository.findByIds([id])
                return (items.length !== 1) ? undefined : transform(items[0])
            },
        },
        getPasswordResets: {
            type: '[PasswordReset!]!',
            args: {skip: 'Int', limit: 'Int', filter: 'JSON'},
            resolve: async (obj, {skip, limit, filter}): Promise<any> => {
                const distributionCenters = await repository.find(filter, limit, skip)
                return distributionCenters.map(transform)
            },
        },
        countPasswordResets: {
            type: 'Int!',
            args: {filter: 'JSON'},
            resolve: async (obj, {filter}): Promise<any> => {
                return await repository.count(filter)
            }
        }
    })
    schemaComposer.Mutation.addFields({
        /*
        updatePasswordReset: {
            type: 'PasswordReset!',
                args: {id: 'ID!', input: 'PasswordResetPatch!'},
            resolve: async (obj: any, {id, input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), input)
                    item.set(dataToModel(data))
                    if (await repository.update([item])) {
                        return transform(item)
                    }
                } else {
                    throw new Error("no PasswordReset with this id was found")
                }
            }
        },*/
        resetPassword: {
            type: 'Boolean!',
            args: {email: 'String!'},
            resolve: async (obj: any, {email}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const data = await dataToModel(container, email)
                let newPasswordReset: any = repository.parse(data)
                let validation
                try {
                    validation = await
                        newPasswordReset.selfValidate()
                } catch (e) {
                    console.log(e)
                }
                if (validation.success) {
                    newPasswordReset = (await repository.insert([newPasswordReset]))[0]
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
                let instance: any = (await repository.findByIds([id]))[0]
                let userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)

                if (instance.data.secretCode === code) {
                    let rpInstanceData: any = merge(transform(instance), {state: 'processed'})
                    instance.set(rpInstanceData)
                    let updatedRp = repository.update([instance])

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
        }
    })
}
