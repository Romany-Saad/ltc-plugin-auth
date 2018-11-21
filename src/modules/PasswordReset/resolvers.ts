import App from '@lattice/core/lib/App'
import { GraphQLResolveInfo, responsePathAsArray } from 'graphql'
import { IModel, IStringKeyedObject } from '@lattice/core/lib/contracts'
import { PasswordReset, PasswordResets } from './'
import { merge } from 'lodash'
import { names } from '../../index'
import './schema'
import { schemaComposer } from 'graphql-compose'
import bcrypt = require('bcrypt')

import { names as mailNames } from 'ltc-plugin-mail'
import { Users } from '../User'

const transform = (item: any): object => {
  const obj = item.serialize()
  obj.id = item.getId()
  delete obj[ item.getIdFieldName() ]
  return obj
}


export default (container: App): void => {

  const repository = container
    .get<PasswordResets>(names.AUTH_PASSWORD_RESET_REPOSITORY)

  /*schemaComposer.Mutation.addFields({

  })*/
}
