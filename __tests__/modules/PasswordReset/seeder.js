const names = require("./../../../lib").names;
const faker = require("./faker");
const userSeeder = require('./../User/seeder');
const RandExp = require('randexp');

const passwordResetSeeder = async (app, numOfSeeds) => {
    let fakes = [];
    let user = (await userSeeder(app, 1, '123456sd', 'habib@cyber-crafts.com'))[0];
    const passwordResetRepo = app.get(names.AUTH_PASSWORD_RESET_REPOSITORY);
    for(let i = 0; i < numOfSeeds; i++){
        let fake = await faker(user);
        fake.secretCode = new RandExp(/^.{64}$/).gen();
        fake = passwordResetRepo.parse(fake);
        fakes.push(fake)
    }
    let inserted = passwordResetRepo.insert(fakes);
    return inserted
};

module.exports = passwordResetSeeder
