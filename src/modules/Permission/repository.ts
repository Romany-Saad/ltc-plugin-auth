import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { Permission } from './index'
import { IStringKeyedObject } from '@cyber-crafts/ltc-core/lib/contracts'
import { MongoClient } from 'mongodb'

export default class extends AMongoDbRepository<Permission> {
  constructor (client: MongoClient, collectionName: string) {
    super(client, collectionName)
  }

  parse (data: IStringKeyedObject): Permission {
    return new Permission(data)
  }

}
