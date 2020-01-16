import AMongoDbRepository from 'ltc-plugin-mongo/lib/abstractions/AMongoDbRepository';
import { Role } from './index';
import { IStringKeyedObject } from '@cyber-crafts/ltc-core/lib/contracts';
export default class extends AMongoDbRepository<Role> {
    parse(data: IStringKeyedObject): Role;
}
