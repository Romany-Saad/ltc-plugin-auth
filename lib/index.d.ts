import App, { contracts, IStringKeyedObject } from '@cyber-crafts/ltc-core';
import ICustomAuthData from './contracts/ICustomAuthData';
import IPermission from './contracts/IPermission';
import IRestAuthConfig from './contracts/IRestAuthConfig';
import IGraphqlAuthConfig from './contracts/IGraphqlAuthConfig';
export declare const names: {
    AUTH_PERMISSIONS_GRAPHQL_CONFIG: symbol;
    AUTH_USERS_REPOSITORY: symbol;
    AUTH_PASSWORD_RESET_REPOSITORY: symbol;
};
export default class implements contracts.IPlugin {
    name: string;
    authConfig: IStringKeyedObject;
    availablePermissions: IPermission[];
    private resolvers;
    private customData;
    constructor(customData: ICustomAuthData);
    load(container: App): Promise<void>;
    setGraphQlAuthConfig(configs: IGraphqlAuthConfig[]): void;
    setRestAuthConfig(configs: IRestAuthConfig[]): void;
    setAvailablePermissions(customPermissions?: IPermission[]): void;
}
