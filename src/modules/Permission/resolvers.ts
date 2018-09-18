import App from "@lattice/core/lib/App"
import { GraphQLResolveInfo } from "graphql"
import { IModel } from "@lattice/core/lib/contracts"
import { Permission,  Permissions } from "./"
import { merge } from "lodash"
import { names } from "../../index";
import './schema'
import { schemaComposer } from 'graphql-compose'

const transform = (item: Permission): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[item.getIdFieldName()]
  return obj
}

const dataToModel = (data: any): any => {
  return data
}

export default (container: App): void => {

  const repository = container
    .get<Permissions>(names.AUTH_PERMISSIONS_REPOSITORY);

    schemaComposer.Query.addFields({
      getPermission: {
          type: 'Permission!',
          args: {id: 'ID!'},
          resolve: async (obj: any, {id}): Promise<any> => {
              const items = await repository.findByIds([id])
              return (items.length !== 1) ? undefined : transform(items[0])
          },
      },
      getPermissions: {
          type: '[Permission!]!',
              args: {skip: 'Int', limit: 'Int', filter: 'JSON'},
          resolve: async (obj, {skip, limit, filter}): Promise<any> => {
              const distributionCenters = await repository.find(filter, limit, skip)
              return distributionCenters.map(transform)
          },
      },
      countPermissions: {
          type: 'Int!',
              args: {filter: 'JSON'},
          resolve: async (obj, {filter}): Promise<any> => {
              return await repository.count(filter)
          }
      }
    })
    schemaComposer.Mutation.addFields({
      addPermission: {
      type: 'Permission',
          args: {input: 'NewPermission!'},
      resolve: async (obj: any, {input}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
          const data = dataToModel(input)
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
  },
      deletePermission: {
          type: 'Boolean!',
              args: {id: 'ID!'},
          resolve: async (obj: any, {id}: any, context: any, info: GraphQLResolveInfo): Promise<any> => {
              const item = (await repository.findByIds([id]))
              if (item && await repository.remove(item)) {
                  return true
              } else {
                  throw new Error("no Permission with this id was found")
              }
          }
      },
      updatePermission: {
          type: 'Permission!',
              args: {id: 'ID!', input: 'PermissionPatch!'},
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
                  throw new Error("no Permission with this id was found")
              }
          }
      }
    })
}
