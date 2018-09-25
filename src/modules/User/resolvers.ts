import App from "@lattice/core/lib/App"
import { GraphQLResolveInfo } from "graphql"
import { IModel } from "@lattice/core/lib/contracts"
import { User,  Users } from "./"
import { merge } from "lodash"
import { names } from "../../index"
import './schema'
import { schemaComposer } from 'graphql-compose'
import bcrypt = require('bcrypt')
import { IStringKeyedObject } from "@lattice/core/lib/contracts"
import jwt = require('jwt-simple')


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

export default (container: App): void => {

    const repository = container
        .get<Users>(names.AUTH_USERS_REPOSITORY);

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
            args: {username: 'String!', password: 'String!' },
            resolve: async (obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                let user = (await repository.find({username: args.username}))[0];
                let serializedUser:IStringKeyedObject = transform(user);
                return bcrypt.compare(args.password, serializedUser.password)
                    .then((res: Boolean) => {
                        if(res){
                            let token = jwt.encode({userID: user.getId()}, 'LTC_SECRET');
                            let authedUser = {
                                id: user.getId(),
                                username: serializedUser.username,
                                token: token,
                                authorization: serializedUser.permissions
                            };
                            return authedUser
                        } else {
                            throw new Error('Invalid credentials.')
                        }
                    });
            }
        }

    })

    schemaComposer.Mutation.addFields({
        addUser: {
            type: 'User',
            args: {input: 'NewUser!'},
            resolve: async (obj: any, {input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const data = await dataToModel(input)
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
        changePermissions: {
            type: 'User!',
            args: {id: 'ID!', permissions: '[String!]!'},
            resolve: async (obj: any, {id, permissions}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
                const items = (await repository.findByIds([id]))
                if (items.length > 0) {
                    const item = items[0]
                    const data = merge(transform(items[0]), {permissions: permissions})
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
        }
    })
}
