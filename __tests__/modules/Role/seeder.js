const names = require('./../../../lib').names
const faker = require('./faker')

const RoleSeeder = async (app, numOfSeeds) => {
  let fakes = []
  const RoleRepo = app.get(names.AUTH_ROLES_REPOSITORY)
  for (let i = 0; i < numOfSeeds; i++) {
    let fake = await faker()
    fake = RoleRepo.parse(fake)
    fakes.push(fake)
  }
  let inserted = RoleRepo.insert(fakes)
  return inserted
}

module.exports = RoleSeeder
