import IPermission from './IPermission'
import IGraphqlAuthConfig from './IGraphqlAuthConfig'
import IRestAuthConfig from './IRestAuthConfig'

export default interface ICustomAuthData {
  permissions: IPermission[]
  authConfigs: {
    graphql: IGraphqlAuthConfig[],
    rest: IRestAuthConfig[]
  }
}