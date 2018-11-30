const names = require('./../../../lib').names
const userFaker = require('./faker')
const faker = require('faker')
const permissionSeeder = require('./../Permission/seeder')

const userSeeder = async (app, numOfSeeds, password, email = '') => {
  let permission = (await permissionSeeder(app, 1))[0]
  let fakes = []
  const userRepo = app.get(names.AUTH_USERS_REPOSITORY)
  for (let i = 0; i < numOfSeeds; i++) {
    let fake = await userFaker(password, email)
    fake.status = faker.random.arrayElement(['pending', 'active', 'banned'])
    fake.permissions = [permission.getId()]
    fake = userRepo.parse(fake)
    fakes.push(fake)
  }
  let inserted = userRepo.insert(fakes)
  return inserted
}

module.exports = userSeeder
