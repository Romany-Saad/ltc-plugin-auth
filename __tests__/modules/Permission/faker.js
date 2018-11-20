const faker = require('faker')

module.exports = () => ({
  name: faker.lorem.word(),
  endpoint: faker.lorem.word(),
  protected: true
})
