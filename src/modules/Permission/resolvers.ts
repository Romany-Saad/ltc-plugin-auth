import App from '@lattice/core/lib/App'
import { GraphQLResolveInfo } from 'graphql'
import { IModel } from '@lattice/core/lib/contracts'
import { Permission, Permissions } from './'
import { merge } from 'lodash'
import { names } from '../../index'
import './schema'
import { schemaComposer, ResolveParams } from 'graphql-compose'
import { PermissionTC } from './schema'

const transform = (item: Permission): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[ item.getIdFieldName() ]
  return obj
}

const dataToModel = (data: any): any => {
  return data
}

export default (container: App): void => {

  const repository = container
    .get<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY)


  // Queries ===================================
  PermissionTC.addResolver({
    name: 'getPermission',
    type: 'Permission!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = await repository.findByIds([ args.id ])
      return (items.length !== 1) ? undefined : transform(items[ 0 ])
    },
  })
  PermissionTC.addResolver({
    name: 'getPermissions',
    type: '[Permission!]!',
    args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const distributionCenters = await repository.find(args.filter, args.limit, args.skip)
      return distributionCenters.map(transform)
    },
  })
  PermissionTC.addResolver({
    name: 'countPermissions',
    type: 'Int!',
    args: { filter: 'JSON' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      return await repository.count(args.filter)
    },
  })

  schemaComposer.rootQuery().addFields({ getPermission: PermissionTC.getResolver('getPermission') })
  schemaComposer.rootQuery().addFields({ getPermissions: PermissionTC.getResolver('getPermissions') })
  schemaComposer.rootQuery().addFields({ countPermissions: PermissionTC.getResolver('countPermissions') })

  // Mutations ===================================
  /*PermissionTC.addResolver({
      name: 'addPermission',
      type: 'Permission',
      args: {input: 'NewPermission!'},
      resolve: async ({obj, args, context, info}: ResolveParams<App, any>): Promise<any> => {
          const data = dataToModel(args.input)
          let newPermission = repository.parse(data)
          let validation
          try {
              validation = await
                  newPermission.selfValidate()
          } catch (e) {
              console.log(e)
          }
          if (validation.success) {
              newPermission = (await repository.insert([newPermission]))[0]
              return transform(newPermission)
          } else {
              throw new Error(JSON.stringify(validation.errors[0]))
          }
      }
  })*/
  PermissionTC.addResolver({
    name: 'deletePermission',
    type: 'Boolean!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const item = (await repository.findByIds([ args.id ]))
      if (item && await repository.remove(item)) {
        return true
      } else {
        throw new Error('no Permission with this id was found')
      }
    },
  })
  PermissionTC.addResolver({
    name: 'enablePermission',
    type: 'Permission!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = (await repository.findByIds([ args.id ]))
      if (items.length > 0) {
        const item = items[ 0 ]
        const data = merge(transform(items[ 0 ]), { protected: true })
        item.set(dataToModel(data))
        if (await repository.update([ item ])) {
          return transform(item)
        }
      } else {
        throw new Error('no Permission with this id was found')
      }
    },
  })

  PermissionTC.addResolver({
    name: 'disablePermission',
    type: 'Permission!',
    args: { id: 'ID!' },
    resolve: async ({ obj, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const items = (await repository.findByIds([ args.id ]))
      if (items.length > 0) {
        const item = items[ 0 ]
        const data = merge(transform(items[ 0 ]), { protected: false })
        item.set(dataToModel(data))
        if (await repository.update([ item ])) {
          return transform(item)
        }
      } else {
        throw new Error('no Permission with this id was found')
      }
    },
  })

  // schemaComposer.rootMutation().addFields({addPermission: PermissionTC.getResolver('addPermission')})
  schemaComposer.rootMutation().addFields({ deletePermission: PermissionTC.getResolver('deletePermission') })
  schemaComposer.rootMutation().addFields({ enablePermission: PermissionTC.getResolver('enablePermission') })
  schemaComposer.rootMutation().addFields({ disablePermission: PermissionTC.getResolver('disablePermission') })
}
