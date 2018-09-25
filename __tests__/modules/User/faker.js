const faker = require("faker");

module.exports = (permission, password, email) => {
    if (!email) {
        email = faker.internet.email()
    }
    return {
        email: email,
        password: password,
        status: faker.random.arrayElement(['pending', 'active', 'banned']),
        permissions: [permission.data.name]
    }
};
