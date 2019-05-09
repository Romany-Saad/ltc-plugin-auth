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
