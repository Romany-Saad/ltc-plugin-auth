export default interface IRestAuthConfig {
  method: string
  path: string
  authorize: (route: string) => (req: any, res: any, next: any) => void
}