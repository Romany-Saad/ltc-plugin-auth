import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { Permission } from './index'
import { IStringKeyedObject } from '@lattice/core/lib/contracts'
import { MongoClient } from 'mongodb'

export default class extends AMongoDbRepository<Permission> {
  parse (data: IStringKeyedObject): Permission {
    return new Permission(data)
  }

}
