import { getEndpointAuthConfig } from '../helpers'
import App from '@cyber-crafts/ltc-core/lib/App'

const mainAuthMiddleware = (app: App) => (req: any, res: any, next: any) => {
  console.log('main auth started')
  const authConfig = getEndpointAuthConfig(app, req.url, req.method)
  if (!authConfig) {
    res.status(403)
    next('access denied.')
  } else {
    next()
  }
}

export default mainAuthMiddleware




