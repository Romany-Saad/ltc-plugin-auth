const names = require('./../../../lib').names
const userFaker = require('./faker')
const faker = require('faker')
const permissionSeeder = require('./../Permission/seeder')
const bcrypt = require('bcrypt')

const userSeeder = async (app, numOfSeeds, password, email = '') => {
  let fakes = []
  const userRepo = app.get(names.AUTH_USERS_REPOSITORY)
  for (let i = 0; i < numOfSeeds; i++) {
    let fake = await userFaker(password, email)
    fake.status = faker.random.arrayElement(['pending', 'active', 'banned'])
    fake.permissions = [{
      name: 'permission.name',
      data: {},
    }]
    fake.password = await bcrypt.hash(password, 10)
    fake = userRepo.parse(fake)
    fakes.push(fake)
  }
  let inserted = userRepo.insert(fakes)
  return inserted
}

module.exports = userSeeder
