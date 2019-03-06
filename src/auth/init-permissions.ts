import App, { IStringKeyedObject } from '@lattice/core'
import { schemaComposer } from 'graphql-compose'
import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { names } from '../index'
import { names as mailNames } from 'ltc-plugin-mail'
import bcrypt = require('bcrypt')

export const initPermissions = async (app: App, unprotectedEndpoints: string[] = [], customPermissions: IStringKeyedObject[]) => {
  // repository declarations
  const permissionsRepo = app.get<AMongoDbRepository<any>>(names.AUTH_PERMISSIONS_REPOSITORY)
  const userRepo = app.get<AMongoDbRepository<any>>(names.AUTH_USERS_REPOSITORY)
  // get existing endpoints in database
  const databasesPermissions = await permissionsRepo.find({}, 0)
  let databaseEndpoints = databasesPermissions.map(permission => {
    return permission.data.name
  })
  // get all endpoints from plugins
  let queryEndpoints = schemaComposer.rootQuery().getFields()
  let mutationEndpoints = schemaComposer.rootMutation().getFields()
  // TODO: find a workaround to add subscriptions
  // let subscriptionEndpoints = schemaComposer.rootSubscription().getFields()
  // get all the endpoints that doesn't exist in db
  let newEndpoints = []
  for (let endpoint in queryEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      let data = {
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'query',
      }
      if (unprotectedEndpoints.indexOf(endpoint) > -1) {
        data.protected = false
      }
      newEndpoints.push(permissionsRepo.parse(data))
    }
  }
  for (let endpoint in mutationEndpoints) {
    if (databaseEndpoints.indexOf(endpoint) === -1) {
      let data = {
        endpoint: endpoint,
        name: endpoint,
        protected: true,
        type: 'mutation',
      }
      if (unprotectedEndpoints.indexOf(endpoint) > -1) {
        data.protected = false
      }
      newEndpoints.push(permissionsRepo.parse(data))
    }
  }
  // check if any of the customPermissions isn't in permissions
  for (let endpoint of customPermissions) {
    if (databaseEndpoints.indexOf(endpoint.name) === -1) {
      newEndpoints.push(permissionsRepo.parse(endpoint))
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
  // TODO: find a way around this
  if (newEndpoints.length) {
    permissionsRepo.insert(newEndpoints)
      .then(async permissions => {
        let userConfig = app.config().get('auth').admin
        // check if admin user already exists
        let user = (await userRepo.find({ email: userConfig.email }))[ 0 ]
        // if exists and permissions > 0 then update
        if (user) {
          if (permissions.length > 0) {
            // check if the old permissions were ids or objects
            // if ids then convert them to objects
            const allPermissions = []
            for (let permission of user.data.permissions) {
              if (typeof permission === 'string') {
                let current = databasesPermissions.find(p => p.getId() === permission)
                allPermissions.push({
                  name: current.data.name,
                  data: {}
                })
              } else {
                allPermissions.push(permission)
              }
            }
            // push the new permissions to allPermissions and then replace in user
            allPermissions.push(...permissions.map(p => {
              return { name: p.data.name, data: {} }
            }))
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
            password: await bcrypt.hash(userConfig.password, 10),
            status: 'active',
            permissions: permissions.map(p => {
              return { name: p.data.name, data: {} }
            }),
            name: userConfig.name,
          }
          let newUser = userRepo.parse(userData)
          let validation = await newUser.selfValidate()
          if (validation.success) {
            userRepo.insert([ newUser ])
              .catch(err => {
                throw new Error(err)
              })
          } else {
            console.log(validation)
          }
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


