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
const getSocialMediaUser = async (app: App, platform: string, userData: any) => {
  const userRepo = app.get<Users>(names.AUTH_USERS_REPOSITORY)
  if (platform === 'twitter') {
    const emails = userData.emails.map((email: any) => email.value)
    return (await userRepo.find({
      $or: [
        {
          email: {
            $in: emails,
          },
        },
        {
          'socialMediaData.twitter.userId': userData.id,
        },
      ],
    }))[ 0 ]
  }
  else {
    if (platform === 'google') {
      const emails = userData.emails.map((email: any) => email.value)
      return (await userRepo.find({
        $or: [
          {
            email: {
              $in: emails,
            },
          },
          {
            'socialMediaData.google.userId': userData.id,
          },
        ],
      }))[ 0 ]
    }
  }
}

const getNormalizedUserData = (platform: string, userData: any) => {
  if (platform === 'twitter') {
    return {
      id: userData.id,
      username: userData.username,
      emails: userData.emails
    }
  } else if (platform === 'google') {
    return {
      id: userData.id,
      username: userData.displayName,
      emails: userData.emails
    }
  }
  else if (platform === 'facebook') {
    return {
      id: userData.id,
      username: userData.displayName,
      emails: userData.emails
    }
  }
}

//TODO: change res and next params
export const socialMediaLogin = async (container: App, platform: string, userData: any, res: any, next: any) => {
  // TODO: this needs to be more modular
  console.log(platform)
  // if (platform === 'facebook') {
  //   res.send(userData)
  // }
  userData = getNormalizedUserData(platform, userData)
  const userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)
  // check if user already exists
  const user = await getSocialMediaUser(container, platform, userData)
  // if email already exists then create a jwt and sent it back
  if (user) {
    let socialMediaData = user.get('socialMediaData')
    if (socialMediaData && socialMediaData[platform]) {
      const idExists = socialMediaData[platform].findIndex((account: any) => {
        return account.userId === userData.id
      })
      if (idExists === -1) {
        // TODO: change this to take dynamic data
        socialMediaData[platform].push({
          userId: userData.id,
        })
      }
    } else {
      if (socialMediaData) {
        socialMediaData[platform] = [ {
          userId: userData.id,
        } ]
      } else {
        socialMediaData = {
          [platform]: [ {
            userId: userData.id,
          } ],
        }
      }
    }
    const authedData = await loginUser(container, user, platform, socialMediaData)
    if (authedData) {
      return res.json(authedData)
    } else {
      return next('Error occurred on login.')
    }

  } else {
    // if not then register the user and log him in
    console.log(userData.emails)
    const newUserData: IStringKeyedObject = {
      email: userData.emails[ 0 ].value,
      status: 'active',
      name: userData.username,
      permissions: [],
    }
    let newUser = userRepo.parse(newUserData)
    const validation = await newUser.selfValidate()
    if (validation.success) {
      newUser = (await userRepo.insert([ newUser ]))[ 0 ]
      const authedData = await loginUser(container, newUser, platform, {
        [platform]: [ {
          userId: userData,
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