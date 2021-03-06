import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository';
import { PasswordReset } from './index';
import { IStringKeyedObject } from '@cyber-crafts/ltc-core/lib/contracts';
export default class extends AMongoDbRepository<PasswordReset> {
    parse(data: IStringKeyedObject): PasswordReset;
}
