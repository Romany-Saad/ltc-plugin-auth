export default interface IGraphqlAuthConfig {
  endpoint: string
  type: string
  authorize: (next: any) => (obj: any, args: any, context: any, info: any) => void
}
