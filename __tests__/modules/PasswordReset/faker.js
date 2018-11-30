const faker = require('faker')

module.exports = (user) => ({
  /*userId: user.getId(),
  createdAt: faker.date.future(1),
  state: 'pending'*/
  email: user.data.email,
})
