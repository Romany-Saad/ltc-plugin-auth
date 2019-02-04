const path = require('path')
const App = require('@lattice/core/lib/App').default
const ConfigPlugin = require('ltc-plugin-config').default
const MongoPlugin = require('ltc-plugin-mongo').default
const MailPlugin = require('ltc-plugin-mail').default
const Plugin = require('../../lib/index').default
//// here you can import other plugins


// creating a new app instance
const app = new App()
const unprotectedEndpoints = [
  'login',
  'register',
  'getVideos',
  'getModels',
  'getCompanies',
  'getOwnProfile'
]

const customPermissions = [
  {
    name: 'postFile',
    endpoint: 'media',
    protected: true,
    type: 'rest',
  },
  {
    name: 'blog.editor.update',
    endpoint: 'updateArticles',
    protected: true,
    type: 'mutation',
  },
  {
    name: 'findOwnFiles',
    endpoint: 'findFiles',
    protected: true,
    type: 'query',
  },
  {
    name: 'deleteOwnVehicles',
    endpoint: 'deleteVehicles',
    protected: true,
    type: 'mutation',
  },
  {
    name: 'admin.addProfile',
    endpoint: 'addProfile',
    protected: true,
    type: 'mutation',
  },
  {
    name: 'admin.updateProfile',
    endpoint: 'updateProfile',
    protected: true,
    type: 'mutation',
  },
]
// initialize plugins here
const plugin = new Plugin(unprotectedEndpoints, customPermissions)

// adding plugins to app instance
app.addPlugin(new ConfigPlugin(path.resolve(__dirname, '../config')))
app.addPlugin(new MailPlugin())
app.addPlugin(new MongoPlugin())
app.addPlugin(plugin)

async function registerPluginsAndInitApp() {
  await app.load()
  return app
}

module.exports = registerPluginsAndInitApp
