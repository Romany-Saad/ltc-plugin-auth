import { Users } from './modules/User'
import { loginUser } from './modules/User/helpers'
import App, { IStringKeyedObject } from '@cyber-crafts/ltc-core'
import { names } from './index'

export const merge = (...items: Array<any>) => {
  let result = {}
  for (let item of items) {
    result = { ...result, ...item }
  }
  return result
}

export const socialMediaLogin = (container: App) => async (req: any, res: any, next: any) => {
  // TODO: this needs to be more modular
  const reqUser: any = req.user
  const userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)
  // check if user already exists
  const emails = reqUser.emails.map((email: any) => email.value)
  const user = (await userRepo.find({
      $or: [
        {
          email: {
            $in: emails,
          },
        },
        {
          'socialMediaData.twitter.userId': reqUser.id,
        },
      ],
    })
  )[ 0 ]
  // if email already exists then create a jwt and sent it back
  if (user) {
    let socialMediaData = user.get('socialMediaData')
    if (socialMediaData && socialMediaData.twitter) {
      const idExists = socialMediaData.twitter.findIndex((account: any) => {
        return account.userId === reqUser.id
      })
      if (idExists === -1) {
        socialMediaData.twitter.push({
          userId: reqUser.id,
        })
      }
    } else {
      if (socialMediaData) {
        socialMediaData.twitter = [ {
          userId: reqUser.id,
        } ]
      } else {
        socialMediaData = {
          twitter: [ {
            userId: reqUser.id,
          } ],
        }
      }
    }
    const authedData = await loginUser(container, user, 'twitter', socialMediaData)
    if (authedData) {
      console.log(`[authed from user] ${authedData}`)
      return res.json(authedData)
    } else {
      return next('Error occurred on login.')
    }

  } else {
    // if not then register the user and log him in
    console.log(reqUser.emails)
    const newUserData: IStringKeyedObject = {
      email: reqUser.emails[ 0 ].value,
      status: 'active',
      name: reqUser.username,
      permissions: [],
    }
    let newUser = userRepo.parse(newUserData)
    const validation = await newUser.selfValidate()
    if (validation.success) {
      newUser = (await userRepo.insert([ newUser ]))[ 0 ]
      const authedData = await loginUser(container, newUser, 'twitter', {
        twitter: [ {
          userId: reqUser,
        } ],
      })
      if (authedData) {
        console.log(`[authed from clean] ${authedData}`)
        return res.json(authedData)
      } else {
        return next('Error occurred on login.')
      }
    } else {
      console.log(JSON.stringify(validation.errors))
      return next(JSON.stringify(validation.errors[ 0 ]))
    }
  }
}