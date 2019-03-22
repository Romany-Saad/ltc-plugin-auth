import App from '@lattice/core';
export declare const graphQlDefaultAuth: (next: any) => (rp: any) => any;
export declare const restDefaultAuth: (req: any, res: any, next: any) => void;
export declare const getEndpointAuthConfig: (app: App, endpoint: string, httpMethod: string) => any;
