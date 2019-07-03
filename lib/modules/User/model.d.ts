import BaseModel from '@cyber-crafts/ltc-core/lib/abstractions/BaseModel';
import { ITypeValidator } from 'c2v/lib/contracts';
export default class extends BaseModel {
    protected schema: ITypeValidator;
}
