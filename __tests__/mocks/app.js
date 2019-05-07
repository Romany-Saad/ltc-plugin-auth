const path = require('path')
const App = require('@lattice/core/lib/App').default
const ConfigPlugin = require('ltc-plugin-config').default
const MongoPlugin = require('ltc-plugin-mongo').default
const MailPlugin = require('ltc-plugin-mail').default
const RecaptchaPlugin = require('ltc-plugin-grecaptcha').default
const Plugin = require('../../lib/index').default
//// here you can import other plugins


// creating a new app instance
const app = new App()

const customData = {
  permissions: [
    {
      name: 'postFile',
      description: '',
    },
    {
      name: 'blog.editor.update',
      description: '',
    },
    {
      name: 'findOwnFiles',
      description: '',
    },
    {
      name: 'deleteOwnVehicles',
      description: '',
    },
    {
      name: 'admin.addProfile',
      description: '',
    },
    {
      name: 'admin.updateProfile',
      description: '',
    },
  ],
  authConfigs: {
    graphql: [],
    rest: [],
  },
}
/*

[
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
*/

// initialize plugins here
const plugin = new Plugin(customData)

// adding plugins to app instance
app.addPlugin(new ConfigPlugin(path.resolve(__dirname, '../config')))
app.addPlugin(new MailPlugin())
app.addPlugin(new MongoPlugin())
app.addPlugin(new RecaptchaPlugin())
app.addPlugin(plugin)

async function registerPluginsAndInitApp() {
  await app.load()
  return app
}

module.exports = registerPluginsAndInitApp
// module.exports = app
