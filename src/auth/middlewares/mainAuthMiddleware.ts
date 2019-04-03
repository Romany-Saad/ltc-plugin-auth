import { getEndpointAuthConfig } from '../helpers'
import App from '@lattice/core/lib/App'

const mainAuthMiddleware = (app: App) => (req: any, res: any, next: any) => {
  console.log('main auth started')
  const authConfig = getEndpointAuthConfig(app, req.url, req.method)
  if (!authConfig) {
    res.status(403)
    res.send('access denied.')
  }
  next()
}

export default mainAuthMiddleware




