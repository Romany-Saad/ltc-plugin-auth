import BaseModel from '@cyber-crafts/ltc-core/lib/abstractions/BaseModel'
import c2v from 'c2v'
import { ITypeValidator } from 'c2v/lib/contracts'

export default class extends BaseModel {
  protected schema: ITypeValidator = c2v.obj
    .requires('name', 'endpoint', 'protected', 'type')
    .keys({
      name: c2v.str.minLength(2).maxLength(128),
      endpoint: c2v.str,
      protected: c2v.bool,
      type: c2v.str.in('query', 'mutation', 'subscription', 'rest'),
    })
}
