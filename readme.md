# Auth config

```
secret: LTC_CMS_SECRET
admin:
  name: admin
  password: 123456sd
  email: contact@cyber-crafts.com
user:
  defaultPermissions:
    -   name: perm1
        data: {}
emails:
  adminCreated:
    subject: Hasan Kutbi - admin account data
    templatePath: __tests__/modules/User/adminCreatedTemp.ejs
  addUser:
    subject: Hasan Kutbi - Welcome to Arabian drive
    templatePath: __tests__/modules/User/registerTemp.ejs
  register:
    subject: Hasan Kutbi - Welcome to Arabian drive
    templatePath: __tests__/modules/User/registerTemp.ejs
  resetPassword:
    subject: Hasan Kutbi - Password reset request
    templatePath: __tests__/modules/PasswordReset/resetPasswordTemp.ejs

roles:
  - name: some-role
    permissions:
      -   name: perm1
          data: {}
    description: something

availableLoginPlatforms:
 - twitter
 - facebook
 - google


google:
 client_id: 36576950896-7tas1css3lum6o63th2h4vercieq2n82.apps.googleusercontent.com
 client_secret: Kzbhohfo6MaIBYbW-IYzXm2I


facebook:
 appId: 616266545526732
 appSecret: 72c7ef0980d64e8890fcaa1dc886a649


twitter:
 consumerKey: wUYMxpqWbeOV8u3TZzLV0rrBK
 consumerSecret: zLYe80TuCJ2Kikqg3eFVjGSJvkXydbSR4luHFbzIcWoYvu2t9I

```

## secret:
used for encoding and decoding JWT.

## admin: 
The main admin account data which is used to seed system admin on process start. This admin has totall access on all endpoints and permissions.

## user: 
contains general info that is used for all users by default 
- defaultPermissions: array of default permissions to be calculated for every user per request

## emails:
An object that contains info about every email that is sent by the system (subject / template).

## roles: 
An array of roles that contains each user role's name, array of permissions and description.

# permissions: 
permissions for any given user is calculated on each request by combining his specific permissions (stored in database), default permissions and his roles' permissions.

# API requirement to use social media login:
For every project that needs to use them express session and passport need to be initialized on the API 
and the new configs should be added

## How to use:
Make a GET request to one of the three endpoints for each social media:
- `/twitter/oauth`
- `/facebook/oauth`
- `/google/oauth`

The response will be a normal AuthedUser type
