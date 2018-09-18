import BaseModel from "@lattice/core/lib/abstractions/BaseModel"
import { rootPath } from "../../globals"
import c2v from 'c2v'
import { ITypeValidator } from "c2v/lib/contracts"

export default class extends BaseModel {
  protected schema: ITypeValidator = c2v.obj
      .requires('name')
      .keys({
          name: c2v.str.minLength(2).maxLength(128)
      })
}
