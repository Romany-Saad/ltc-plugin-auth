const path = require('path')
const App = require('@lattice/core/lib/App').default
const CommonPlugin = require('ltc-plugin-common').default
const ConfigPlugin = require('ltc-plugin-config').default
const MongoPlugin = require('ltc-plugin-mongo').default
const MailPlugin = require('ltc-plugin-mail').default
const Plugin = require('../../lib/index').default
//// here you can import other plugins


// creating a new app instance
const app = new App()

// initialize plugins here
const plugin = new Plugin()

// adding plugins to app instance
app.addPlugin(new CommonPlugin())
app.addPlugin(new ConfigPlugin(path.resolve(__dirname, '../config')))
app.addPlugin(new MailPlugin())
app.addPlugin(new MongoPlugin())
app.addPlugin(plugin)

async function registerPluginsAndInitApp() {
  await app.load()
  return app
}

module.exports = registerPluginsAndInitApp
