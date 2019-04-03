export default interface IGraphqlAuthConfig {
  endpoint: string
  type: string
  authorize: (next: any) => (rp: any) => void
}