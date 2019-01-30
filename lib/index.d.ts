import App, { contracts, IStringKeyedObject } from '@lattice/core';
export declare const names: {
    AUTH_PERMISSIONS_REPOSITORY: symbol;
    AUTH_USERS_REPOSITORY: symbol;
    AUTH_PASSWORD_RESET_REPOSITORY: symbol;
};
export default class implements contracts.IPlugin {
    name: string;
    private resolvers;
    private unprotectedEndpoints;
    private customPermissions;
    constructor(unprotectedEndpoints: string[], customPermissions: IStringKeyedObject[]);
    load(container: App): Promise<void>;
}
