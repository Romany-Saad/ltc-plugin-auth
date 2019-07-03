import App from '@cyber-crafts/ltc-core/lib/App'
import { Permission } from './'
import './schema'
import { ResolveParams, schemaComposer } from 'graphql-compose'
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


  // Queries ===================================
  PermissionTC.addResolver({
    name: 'getPermissions',
    type: '[Permission!]!',
    args: { skip: 'Int', limit: 'Int', filter: 'JSON' },
    resolve: async ({ source, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const authPlugin: any = source.getPlugin('cyber-crafts.cms-plugin-auth')
      const permissions = authPlugin.availablePermissions
      return permissions
    },
  })

  PermissionTC.addResolver({
    name: 'countPermissions',
    type: 'Int!',
    args: { filter: 'JSON' },
    resolve: async ({ source, args, context, info }: ResolveParams<App, any>): Promise<any> => {
      const authPlugin: any = source.getPlugin('cyber-crafts.cms-plugin-auth')
      const permissions = authPlugin.availablePermissions
      return permissions.length
    },
  })

  schemaComposer.rootQuery().addFields({ getPermissions: PermissionTC.getResolver('getPermissions') })
  schemaComposer.rootQuery().addFields({ countPermissions: PermissionTC.getResolver('countPermissions') })
}
