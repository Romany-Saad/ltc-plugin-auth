export declare enum DateAdditionTypes {
    seconds = 0,
    days = 1
}
export declare const merge: (...items: any[]) => {};
export declare const addToDate: (date: Date, count: number, inputType: DateAdditionTypes) => false | Date;
