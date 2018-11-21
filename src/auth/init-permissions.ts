import App from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { names } from '../index'
import bcrypt = require('bcrypt')
import { names as mailNames } from 'ltc-plugin-mail'

export const initPermissions = async (app: App) => {
  // repository declarations
  const permissionsRepo = app.get<AMongoDbRepository<any>>(names.AUTH_PERMISSIONS_REPOSITORY)
  const userRepo = app.get<AMongoDbRepository<any>>(names.AUTH_USERS_REPOSITORY)
  // get existing endpoints in database
  const databasesPermissions = await permissionsRepo.find({})
  let databaseEndpoints = databasesPermissions.map(permission => {
    return permission.data.endpoint
  })
  // get all endpoints from plugins
  let queryEndpoints = schemaComposer.rootQuery().getFields()
  let mutationEndpoints = schemaComposer.rootMutation().getFields()
  // TODO: find a workaround to add subscriptions
  let subscriptionEndpoints = schemaComposer.Subscription.getFields()
  // get all the endpoints that doesn't exist in db
  let newEndpoints = []
  for (let endpoint in queryEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'query',
      }))
    }
  }
  for (let endpoint in mutationEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'mutation',
      }))
    }
  }
  /*for (let endpoint in subscriptionEndpoints) {
    console.log(endpoint)
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      newEndpoints.push(permissionsRepo.parse({
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'subscription',
      }))
    }
  }*/
  if (newEndpoints.length) {
    permissionsRepo.insert(newEndpoints)
      .then(async permissions => {
        let permissionsIds = permissions.map(permission => {
          return permission.getId()
        })
        let userConfig = app.config().get('auth').admin
        console.log(userConfig)
        // check if admin user already exists
        let user = (await userRepo.find({ email: userConfig.email }))[ 0 ]
        // if exists and permissions > 0 then update
        if (user) {
          if (permissions.length > 0) {
            let allPermissions = user.data.permissions.concat(permissionsIds)
            allPermissions = [ ...new Set(allPermissions) ]
            user.set({ permissions: allPermissions })
            userRepo.update([ user ])
              .catch(err => {
                console.log(err)
              })
          }
        } else {
          // if user doesn't exist create it and give it all the permissions
          let userData = {
            email: userConfig.email,
            password: bcrypt.hash(userConfig.password, 10),
            status: 'active',
            permissions: permissionsIds,
            name: userConfig.name,
          }
          let newUser = userRepo.parse(userData)
          userRepo.insert([ newUser ])
            .catch(err => {
              throw new Error(err)
            })
          //  send the user data to the specified email
          let transporter: any = app.get(mailNames.MAIL_TRANSPORTER_SERVICE)
          let mailOptions = {
            from: 'admin', // sender address
            to: userConfig.email, // list of receivers
            subject: 'Hassan Kutbi - admin account data', // Subject line
            html: `<h1>Your login data: </h1><br>` +
              `<p>name: ${userConfig.name}</p>` +
              `<p>password: ${userConfig.password}</p>`, // html body
          }
          transporter.sendMail(mailOptions)
            .catch((err: any) => {
              console.log(err)
            })
        }
      })
      .catch(err => {
        throw new Error(err)
      })
  }
}