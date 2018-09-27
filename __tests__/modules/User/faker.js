const faker = require("faker");

module.exports = (password, email) => {
    if (!email) {
        email = faker.internet.email()
    }
    return {
        email: email,
        password: password,
        name: faker.random.word()
        // status: faker.random.arrayElement(['pending', 'active', 'banned']),
        // permissions: [permission.data.name]
    }
};
