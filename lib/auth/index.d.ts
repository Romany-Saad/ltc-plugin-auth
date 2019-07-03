import IStringKeyedObject from '@cyber-crafts/ltc-core/lib/contracts/IStringKeyedObject';
import App from '@cyber-crafts/ltc-core';
export default class Auth {
    protected authorizationData: IStringKeyedObject;
    protected app: App;
    constructor(container: App, authorizaionHeader: string);
    getTokenFromHeader(token: string): string;
    getAuthedUser(): IStringKeyedObject;
    initUserPermissions(): Promise<any>;
}
