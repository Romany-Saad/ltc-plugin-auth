import App from '@lattice/core/lib/App'
import { PasswordResets } from './'
import { names } from '../../index'
import './schema'

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
