import App from '@cyber-crafts/ltc-core';
export declare const merge: (...items: any[]) => {};
export declare const socialMediaLogin: (container: App, platform: string, userData: any) => Promise<{
    success: boolean;
    payload: any;
    msg?: undefined;
} | {
    success: boolean;
    msg: string;
    payload?: undefined;
}>;
export declare const initializeSocialMediaLoginPlatforms: (app: App) => void;
