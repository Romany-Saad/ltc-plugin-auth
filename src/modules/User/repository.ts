import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { User } from './index'
import { IStringKeyedObject } from '@cyber-crafts/ltc-core/lib/contracts'

export default class extends AMongoDbRepository<User> {
  parse (data: IStringKeyedObject): User {
    return new User(data)
  }

}
