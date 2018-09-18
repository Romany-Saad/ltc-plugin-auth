const faker = require("faker");

module.exports = (permission, password) => ({
    email: faker.internet.email(),
    password: password,
    status: faker.random.arrayElement(['pending', 'active', 'banned']),
    permissions: [permission.data.name]
});
