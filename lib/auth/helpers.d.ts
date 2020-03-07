import App from '@cyber-crafts/ltc-core';
export declare const graphQlDefaultAuth: (next: any) => (obj: any, args: any, context: any, info: any) => any;
export declare const graphQlDefaultUnprotectedAuth: (next: any) => (rp: any) => any;
export declare const restDefaultAuth: (route: string) => (req: any, res: any, next: any) => void;
export declare const restDefaultUnprotectedAuth: (route: string) => (req: any, res: any, next: any) => void;
export declare const getEndpointAuthConfig: (app: App, endpoint: string, httpMethod: string) => any;
