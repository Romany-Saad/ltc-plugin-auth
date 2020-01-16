import BaseModel from '@cyber-crafts/ltc-core/lib/abstractions/BaseModel'
import c2v from 'c2v'
import { ITypeValidator } from 'c2v/lib/contracts'
import { mongoUnique } from 'ltc-plugin-mongo/lib/validators'
import { names } from '../../index'

export default class Role extends BaseModel {
  protected _schema: ITypeValidator

  get schema (): ITypeValidator {
    return this.generateSchema()
  }

  set schema (schema) {
    this._schema = schema
  }

  generateSchema () {
    let schema: ITypeValidator = c2v.obj
      .requires('name', 'permissions')
      .keys({
        name: c2v.str.addRule({
          name: 'unique-name',
          func: mongoUnique(names.AUTH_ROLES_REPOSITORY, 'roles', 'name', this.getId()),
        }),
        permissions: c2v.arr.minItems(1).allItems(
          c2v.obj.requires('name')
            .keys({
              name: c2v.str,
              data: c2v.obj,
            }),
        ),
        description: c2v.str,
      })
    return schema
  }
}
