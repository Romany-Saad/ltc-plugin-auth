import { getEndpointAuthConfig } from '../helpers'
import App from '@cyber-crafts/ltc-core/lib/App'

const mainAuthMiddleware = (app: App) => (req: any, res: any, next: any) => {
  const authConfig = getEndpointAuthConfig(app, req.url, req.method)
  if (!authConfig) {
    res.status(403)
    return res.send('access denied.')
  } else {
    next()
  }
}

export default mainAuthMiddleware




