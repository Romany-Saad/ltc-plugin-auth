const app = require('./app')
const mainAuthMiddleware = require('./../../lib/auth/middlewares/mainAuthMiddleware').default
const coreNames = require('@lattice/core').names

app.express.use(async (req, res, next) => {
  req.user = {
    permissions: [{
      name: 'postFile',
      data: {},
    }],
  }
  next()
})
app.express.get('/something', (req, res, next) => {
  next()
})

app.start()

app.emitter.on(coreNames.EV_SERVER_STARTED, async (items) => {
  app.express.use(mainAuthMiddleware(app))
})

function availableRoutes(app) {
  return app.express._router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path,
      }
    })
}
