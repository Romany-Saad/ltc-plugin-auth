const app = require('./app').app
const mainAuthMiddleware = require('./../../lib/auth/middlewares/mainAuthMiddleware').default
const coreNames = require('@cyber-crafts/ltc-core').names
const passport = require('passport')
const TwitterStrategy = require('passport-twitter')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const expressSession = require('express-session')



app.emitter.on(coreNames.EV_SERVER_STARTED, async (items) => {
  app.express.use(mainAuthMiddleware(app))
})


app.emitter.on(coreNames.EV_PLUGINS_LOADING, async (items) => {
  app.express.use(expressSession({secret: 'keyboard cat', resave: true, saveUninitialized: true}))

  app.express.use(passport.initialize())

})
app.emitter.on(coreNames.EV_PLUGINS_LOADED, async (items) => {
  passport.serializeUser(function (user, cb) {
    cb(null, user)
  })

  passport.deserializeUser(function (obj, cb) {
    cb(null, obj)
  })
  const twitterConfig = app.config().get('auth.twitter')
  const googleConfig = app.config().get('auth.google')
  const facebookConfig = app.config().get('auth.facebook')


  passport.use(new GoogleStrategy({
      clientID: googleConfig.client_id,
      clientSecret: googleConfig.client_secret,
      callbackURL: "/oauth/callback?platform=google"
    },
    function(accessToken, refreshToken, profile, cb) {
      // console.log(`[token] ${token}`)
      // console.log(`[token secret] ${tokenSecret}`)
      return cb(null, profile)
    }
  ));
  passport.use(new FacebookStrategy({
      clientID: facebookConfig.appId,
      clientSecret: facebookConfig.appSecret,
      callbackURL: "/oauth/callback?platform=facebook",
      profileFields: ['id', 'displayName', 'email']
    },
    function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile)
    }
  ));

  passport.use(new TwitterStrategy({
      consumerKey: twitterConfig.consumerKey,
      consumerSecret: twitterConfig.consumerSecret,
      userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      callbackURL: `${twitterConfig.callbackURL}?platform=twitter`,
    },
    function (token, tokenSecret, profile, cb) {
      console.log(`[token] ${token}`)
      console.log(`[token secret] ${tokenSecret}`)
      return cb(null, profile)
    },
  ))


  app.express.use(async (req, res, next) => {
    req.user = {
      permissions: [{
        name: 'postFile',
        data: {},
      }],
    }
    next()
  })
})

function availableRoutes(app) {
  return app.express._router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        method: Object.keys(r.route.methods)[0].toUpperCase(),
        path: r.route.path,
      }
    })
}
app.start()
