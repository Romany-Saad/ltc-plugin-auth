import App, { contracts, IStringKeyedObject } from '@lattice/core';
export declare const names: {
    AUTH_PERMISSIONS_REPOSITORY: symbol;
    AUTH_PERMISSIONS_GRAPHQL_CONFIG: symbol;
    AUTH_USERS_REPOSITORY: symbol;
    AUTH_PASSWORD_RESET_REPOSITORY: symbol;
};
export default class implements contracts.IPlugin {
    name: string;
    private resolvers;
    private customData;
    authConfig: IStringKeyedObject;
    availablePermissions: IStringKeyedObject[];
    constructor(customData: IStringKeyedObject);
    load(container: App): Promise<void>;
    setGraphQlAuthConfig(config: IStringKeyedObject[]): void;
    setRestAuthConfig(config: IStringKeyedObject[]): void;
    setAvailablePermissions(customPermissions?: IStringKeyedObject[]): void;
}
