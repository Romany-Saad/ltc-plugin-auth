import BaseModel from '@lattice/core/lib/abstractions/BaseModel'
import c2v from 'c2v'
import { ITypeValidator } from 'c2v/lib/contracts'
import { mongoExists } from 'ltc-plugin-mongo/lib/validators'
import { names } from '../../index'

export default class extends BaseModel {
  protected schema: ITypeValidator = c2v.obj
    .requires('userId', 'secretCode', 'createdAt', 'state')
    .keys({
      userId: c2v.str.attach(mongoExists(names.AUTH_USERS_REPOSITORY, 'users', '_id')),
      secretCode: c2v.str.minLength(64),
      createdAt: c2v.date,
      state: c2v.str.in('pending', 'processed'),
    })
}
