import App from '@cyber-crafts/ltc-core'
import { resolvers as UserResolvers } from '../modules/User'
import { resolvers as PermissionResolvers } from '../modules/Permission'
import { resolvers as PasswordResetResolvers } from '../modules/PasswordReset'

export default (app: App): void => {
  UserResolvers(app)
  PermissionResolvers(app)
  PasswordResetResolvers(app)
}
