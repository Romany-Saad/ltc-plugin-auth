import App, { contracts } from "@lattice/core";
export declare const names: {
    AUTH_PERMISSIONS_REPOSITORY: symbol;
    AUTH_USERS_REPOSITORY: symbol;
};
export default class implements contracts.IPlugin {
    name: string;
    private resolvers;
    constructor();
    load(container: App): Promise<void>;
}
