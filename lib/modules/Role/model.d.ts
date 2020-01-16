import BaseModel from '@cyber-crafts/ltc-core/lib/abstractions/BaseModel';
import { ITypeValidator } from 'c2v/lib/contracts';
export default class Role extends BaseModel {
    protected _schema: ITypeValidator;
    get schema(): ITypeValidator;
    set schema(schema: ITypeValidator);
    generateSchema(): ITypeValidator;
}
