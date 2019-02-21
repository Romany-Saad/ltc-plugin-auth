const faker = require('faker')

module.exports = () => ({
  name: faker.lorem.word() + faker.helpers.replaceSymbols('#?#?#?'),
  endpoint: faker.lorem.word(),
  protected: true,
  type: faker.random.arrayElement(['query', 'mutation', 'subscription']),
})
