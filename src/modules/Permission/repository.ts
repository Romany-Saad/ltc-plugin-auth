import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository'
import { Permission } from './index'
import { IStringKeyedObject } from '@lattice/core/lib/contracts'
import { MongoClient } from 'mongodb'

export default class extends AMongoDbRepository<Permission> {
  parse (data: IStringKeyedObject): Permission {
    return new Permission(data)
  }

  setNameIndex () {
    this.client.db().collections()
      .then(collections => {
        const collectionsNames = collections.map(c => c.collectionName)
        if (collectionsNames.indexOf('permissions') > -1) {
          this.collection.indexExists('permission.name')
            .then(async bool => {
              if (!bool) {
                this.collection.createIndexes([ {
                  name: 'permission.name',
                  key: { 'name': 1 },
                  unique: true,
                } ])
                  .catch(err => {
                    console.log(err)
                  })
              }
            })
        }
      })
  }

  constructor (client: MongoClient, collectionName: string) {
    super(client, collectionName)
    this.setNameIndex()
  }

}
