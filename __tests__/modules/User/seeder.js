const names = require("./../../../lib").names;
const faker = require("./faker");
const permissionSeeder = require('./../Permission/seeder');

const userSeeder = async (app, numOfSeeds, password) => {
    let permission = (await permissionSeeder(app, 1))[0];
    let fakes = [];
    const userRepo = app.get(names.AUTH_USERS_REPOSITORY);
    for(let i = 0; i < numOfSeeds; i++){
        let fake = userRepo.parse(await faker(permission, password));
        fakes.push(fake)
    }
    let inserted = userRepo.insert(fakes);
    return inserted
};

module.exports = userSeeder
