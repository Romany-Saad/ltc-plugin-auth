import App from '@cyber-crafts/ltc-core/lib/App'
import { Role, Roles } from './'
import { merge } from '../../utils'
import { names } from '../../index'
import './schema'
import { ResolverResolveParams, schemaComposer } from 'graphql-compose'
import { RoleTC } from './schema'

const transform = (item: Role): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[ item.getIdFieldName() ]
  return obj
}

const dataToModel = (data: any): any => {
  return data
}

// Queries ===================================

RoleTC.addResolver({
  name: 'getRole',
  type: 'Role',
  args: { id: 'ID!' },
  resolve: async ({ source, args, context, info }: ResolverResolveParams<App, any>): Promise<any> => {
    const repository = source.get<Roles>(names.AUTH_ROLES_REPOSITORY)
    const items = await repository.findByIds([ args.id ])
    return (items.length !== 1) ? undefined : transform(items[ 0 ])
  },
})


RoleTC.addResolver({
  name: 'getRoles',
  type: 'Roles!',
  args: { skip: 'Int', limit: 'Int', sort: 'JSON', filter: 'JSON' },
  resolve: async ({ source, args, context, info }: ResolverResolveParams<App, any>): Promise<any> => {
    const repository = source.get<Roles>(names.AUTH_ROLES_REPOSITORY)
    const Roles = await repository.find(args.filter, args.limit, args.skip, args.sort)
    return {
      items: Roles.map(transform),
      app: source,
    }
  },
})
schemaComposer.getOTC('Roles')
  .setField('totalCount', {
    type: 'Int!',
    resolve: async (source: any, args, context, info) => {
      const app: any = source.app
      const repository = app.get(names.AUTH_ROLES_REPOSITORY)
      return await repository.count(args.filter)
    },
  })


schemaComposer.Query.addFields({ getRole: RoleTC.getResolver('getRole') })


schemaComposer.Query.addFields({ getRoles: RoleTC.getResolver('getRoles') })


// Mutations ===================================

RoleTC.addResolver({
  name: 'addRole',
  type: 'Role',
  args: { input: 'NewRole!' },
  resolve: async ({ source, args, context, info }: ResolverResolveParams<App, any>): Promise<any> => {
    const repository = source.get<Roles>(names.AUTH_ROLES_REPOSITORY)
    const data = dataToModel(args.input)
    let newRole = repository.parse(data)
    let validation = await newRole.selfValidate()

    if (validation.success) {
      newRole = (await repository.insert([ newRole ]))[ 0 ]
      return transform(newRole)
    } else {
      throw new Error(JSON.stringify(validation.errors[ 0 ]))
    }
  },
})


RoleTC.addResolver({
  name: 'updateRole',
  type: 'Role!',
  args: { id: 'ID!', input: 'RolePatch!' },
  resolve: async ({ source, args, context, info }: ResolverResolveParams<App, any>): Promise<any> => {
    const repository = source.get<Roles>(names.AUTH_ROLES_REPOSITORY)
    const items = (await repository.findByIds([ args.id ]))
    if (items.length > 0) {
      const item = items[ 0 ]
      const data = merge(transform(items[ 0 ]), args.input)
      item.set(dataToModel(data))
      let validation = await item.selfValidate()
      if (!validation.success) {
        throw new Error(JSON.stringify(validation.errors[ 0 ]))
      }
      if (await repository.update([ item ])) {
        return transform(item)
      }
    } else {
      throw new Error('no Role with this id was found')
    }
  },
})


RoleTC.addResolver({
  name: 'deleteRole',
  type: 'Boolean!',
  args: { id: 'ID!' },
  resolve: async ({ source, args, context, info }: ResolverResolveParams<App, any>): Promise<any> => {
    const repository = source.get<Roles>(names.AUTH_ROLES_REPOSITORY)
    const item = (await repository.findByIds([ args.id ]))
    if (item && await repository.remove(item)) {
      return true
    } else {
      throw new Error('no Role with this id was found')
    }
  },
})


schemaComposer.Mutation.addFields({ addRole: RoleTC.getResolver('addRole') })


schemaComposer.Mutation.addFields({ updateRole: RoleTC.getResolver('updateRole') })


schemaComposer.Mutation.addFields({ deleteRole: RoleTC.getResolver('deleteRole') })
  


