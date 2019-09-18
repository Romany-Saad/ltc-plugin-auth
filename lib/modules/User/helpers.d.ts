import App, { IStringKeyedObject } from '@cyber-crafts/ltc-core';
import { User } from './index';
export declare const transform: (item: User) => object;
export declare const verifyGoogleIdToken: (app: App, token: string) => Promise<any>;
export declare const getAuthedUser: (app: App, user: any, authData: {
    authedVia: string;
    lastAuthenticated: any;
}) => any;
export declare const loginUser: (app: App, user: any, loginVia: string, platformData: IStringKeyedObject) => Promise<any>;
