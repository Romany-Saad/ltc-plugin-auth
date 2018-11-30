const names = require('./../../../lib').names
const faker = require('./faker')

const permissionSeeder = async (app, numOfSeeds) => {
  let fakes = []
  const permissionRepo = app.get(names.AUTH_PERMISSIONS_REPOSITORY)
  for (let i = 0; i < numOfSeeds; i++) {
    let fake = permissionRepo.parse(await faker())
    fakes.push(fake)
  }
  let inserted = permissionRepo.insert(fakes)
  return inserted
}

module.exports = permissionSeeder
