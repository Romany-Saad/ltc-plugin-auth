import IStringKeyedObject from '@lattice/core/lib/contracts/IStringKeyedObject';
import App from '@lattice/core';
export default class Auth {
    protected authorizationData: IStringKeyedObject;
    protected app: App;
    constructor(container: App, authorizaionHeader: string);
    getTokenFromHeader(token: string): string;
    getAuthedUser(): IStringKeyedObject;
}
