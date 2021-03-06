import BaseModel from '@cyber-crafts/ltc-core/lib/abstractions/BaseModel'
import c2v from 'c2v'
import { ITypeValidator } from 'c2v/lib/contracts'
import { mongoUnique } from 'ltc-plugin-mongo/lib/validators'
import { names } from '../../index'
import { verifyModelRecaptcha } from 'ltc-plugin-grecaptcha/lib/utils'

export default class extends BaseModel {
  protected schema: ITypeValidator = c2v.obj.keys({
    email: c2v.str.email().attach(mongoUnique(names.AUTH_USERS_REPOSITORY, 'users', 'email', this.getId())),
    password: c2v.str,
    status: c2v.str.in('pending', 'active', 'banned'),
    // permissions: c2v.arr.attach(arrayExists(names.AUTH_PERMISSIONS_REPOSITORY, 'permissions', '_id')),
    permissions: c2v.arr.allItems(
      c2v.obj.requires('name', 'data')
        .keys({
          name: c2v.str,
          data: c2v.obj,
        }),
    ),
    roles: c2v.arr.allItems(c2v.str),
    name: c2v.str.maxLength(32).minLength(2),
    grecaptchaToken: c2v.str.attach(verifyModelRecaptcha('register')),
  })
}
