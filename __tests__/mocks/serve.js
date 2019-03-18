const app = require('./app')
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
  .then(() => {
    console.log(JSON.stringify(availableRoutes(app), null, 2))
  })

function availableRoutes (app) {
  return app.express._router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        method: Object.keys(r.route.methods)[ 0 ].toUpperCase(),
        path: r.route.path,
      }
    })
}
