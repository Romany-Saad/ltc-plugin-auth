const faker = require('faker')

module.exports = () => ({
  name: faker.lorem.word() + faker.helpers.replaceSymbols('?#?#?#'),
  description: faker.lorem.word(),
  permissions: [{
    name: 'perm1',
    data: {},
  }],
})
