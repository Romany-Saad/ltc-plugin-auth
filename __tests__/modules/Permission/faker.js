const faker = require('faker')

module.exports = () => ({
  name: faker.lorem.word(),
  endpoint: faker.lorem.word(),
  protected: true,
  type: faker.random.arrayElement(['query', 'mutation', 'subscription'])
})
