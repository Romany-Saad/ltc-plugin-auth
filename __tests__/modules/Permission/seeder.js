const names = require('./../../../lib').names
const faker = require('./faker')

const permissionSeeder = async (app, numOfSeeds) => {
  let fakes = [
    {
      name: 'login',
      description: '',
    },
    {
      name: 'register',
      description: '',
    },
  ]
  app.getPlugin('cyber-crafts.cms-plugin-auth')
    .setAvailablePermissions(fakes)
  return fakes
}

module.exports = permissionSeeder
