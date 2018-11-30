const faker = require('faker')
const bcrypt = require('bcrypt')

module.exports = async (password, email) => {
  if (!email) {
    email = faker.internet.email()
  }
  return {
    email: email,
    password: await bcrypt.hash(password, 10),
    name: faker.random.word(),
    // status: faker.random.arrayElement(['pending', 'active', 'banned']),
    // permissions: [permission.data.name]
  }
}
