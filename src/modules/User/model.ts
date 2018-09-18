import BaseModel from "@lattice/core/lib/abstractions/BaseModel"
import { rootPath } from "../../globals"
import c2v from 'c2v'
import { ITypeValidator } from "c2v/lib/contracts"
import { arrayExists } from "ltc-plugin-mongo/lib/validators"
import { names } from "../../index"

export default class extends BaseModel {
  protected schema: ITypeValidator = c2v.obj.keys({
      email: c2v.str.email(),
      password: c2v.str,
      status: c2v.str.in('pending', 'active', 'banned'),
      permissions: c2v.arr.attach(arrayExists(names.AUTH_PERMISSIONS_REPOSITORY, 'permissions', 'name'))
  })
}
