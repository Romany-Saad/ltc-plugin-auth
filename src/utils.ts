import { Users } from './modules/User'
import { loginUser } from './modules/User/helpers'
import App, { IStringKeyedObject, names as coreNames } from '@cyber-crafts/ltc-core'
import { names } from './index'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import passport = require('passport')

const TwitterStrategy = require('passport-twitter')
const expressSession = require('express-session')

export const merge = (...items: Array<any>) => {
  let result = {}
  for (let item of items) {
    result = { ...result, ...item }
  }
  return result
}

const getSocialMediaUser = async (app: App, platform: string, userData: any) => {
  const userRepo = app.get<Users>(names.AUTH_USERS_REPOSITORY)
  const emails = userData.emails.map((email: any) => email.value)
  return (await userRepo.find({
    $or: [
      {
        email: {
          $in: emails,
        },
      },
      {
        [ `socialMediaData.${platform}.userId` ]: userData.id,
      },
    ],
  }))[ 0 ]
}

const getNormalizedUserData = (platform: string, userData: any) => {
  if (platform === 'twitter') {
    return {
      id: userData.id,
      username: userData.username,
      emails: userData.emails,
      token: userData.token,
      tokenSecret: userData.tokenSecret

    }
  } else if (platform === 'google') {
    return {
      id: userData.id,
      username: userData.displayName,
      emails: userData.emails,
      accessToken: userData.accessToken
    }
  } else if (platform === 'facebook') {
    return {
      id: userData.id,
      username: userData.displayName,
      emails: userData.emails,
      accessToken: userData.accessToken
    }
  }
}

const generateSocialMediaData = (socialMediaData: any, platform: string, userData: any) => {
  let newData: IStringKeyedObject = {
    userId: userData.id,
  }
  if (platform === 'google') {
    newData.accessToken = userData.accessToken
  } else if (platform === 'facebook') {
    newData.accessToken = userData.accessToken
  } else if (platform === 'twitter') {
    newData.token = userData.token
    newData.tokenSecret = userData.tokenSecret
  }
  if (socialMediaData && socialMediaData[ platform ]) {
    const idExists = socialMediaData[ platform ].findIndex((account: any) => {
      return account.userId === userData.id
    })
    if (idExists === -1) {
      socialMediaData[ platform ].push(newData)
    }
  } else {
    if (socialMediaData) {
      socialMediaData[ platform ] = [ newData ]
    } else {
      socialMediaData = {
        [ platform ]: [ newData ],
      }
    }
  }
  return socialMediaData
}

export const socialMediaLogin = async (container: App, platform: string, userData: any) => {
  userData = getNormalizedUserData(platform, userData)
  const userRepo = container.get<Users>(names.AUTH_USERS_REPOSITORY)
  // check if user already exists
  const user = await getSocialMediaUser(container, platform, userData)
  // if email already exists then create a jwt and sent it back
  if (user) {
    let socialMediaData = user.get('socialMediaData')
    socialMediaData = generateSocialMediaData(socialMediaData, platform, userData)
    const authedData = await loginUser(container, user, platform, socialMediaData)
    if (authedData) {
      return {
        success: true,
        payload: authedData,
      }
    } else {
      return {
        success: false,
        msg: 'Error occurred on login.',
      }
    }

  } else {
    // if not then register the user and log him in
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
      const socialMediaData = generateSocialMediaData(null, platform, userData)
      const authedData = await loginUser(container, newUser, platform, socialMediaData)
      if (authedData) {
        return {
          success: true,
          payload: authedData,
        }
      } else {
        return {
          success: false,
          msg: 'Error occurred on login.',
        }
      }
    } else {
      return {
        success: false,
        msg: JSON.stringify(validation.errors[ 0 ]),
      }
    }
  }
}

export const initializeSocialMediaLoginPlatforms = (app: App) => {
  const authConfigs = app.config().get('auth')
  const availablePlatforms: string[] = authConfigs.availableLoginPlatforms
  if (availablePlatforms) {
    // general passport init
    app.emitter.on(coreNames.EV_PLUGINS_LOADED, async (items) => {
      passport.serializeUser(function (user, cb) {
        cb(null, user)
      })
      passport.deserializeUser(function (obj, cb) {
        cb(null, obj)
      })
    })

    // platform specific strategy init
    if (availablePlatforms.indexOf('google') > -1) {
      const googleConfig = authConfigs.google
      passport.use(new GoogleStrategy({
          clientID: googleConfig.client_id,
          clientSecret: googleConfig.client_secret,
          callbackURL: '/oauth/callback?platform=google',
        },
        function (accessToken: any, refreshToken: any, profile: any, cb: any) {
          profile.accessToken = accessToken
          return cb(null, profile)
        },
      ))
    }
    if (availablePlatforms.indexOf('facebook') > -1) {
      const facebookConfig = authConfigs.facebook
      passport.use(new FacebookStrategy({
          clientID: facebookConfig.appId,
          clientSecret: facebookConfig.appSecret,
          callbackURL: '/oauth/callback?platform=facebook',
          profileFields: [ 'id', 'displayName', 'email' ],
        },
        function (accessToken: any, refreshToken: any, profile: any, cb: any) {
          profile.accessToken = accessToken
          return cb(null, profile)
        },
      ))
    }
    if (availablePlatforms.indexOf('twitter') > -1) {
      const twitterConfig = authConfigs.twitter
      passport.use(new TwitterStrategy({
          consumerKey: twitterConfig.consumerKey,
          consumerSecret: twitterConfig.consumerSecret,
          userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
          callbackURL: `/oauth/callback?platform=twitter`,
        },
        function (token: any, tokenSecret: any, profile: any, cb: any) {
          profile.token = token
          profile.tokenSecret = tokenSecret
          return cb(null, profile)
        },
      ))
    }
  }
}