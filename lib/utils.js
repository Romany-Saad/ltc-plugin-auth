"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DateAdditionTypes;
(function (DateAdditionTypes) {
    DateAdditionTypes[DateAdditionTypes["seconds"] = 0] = "seconds";
    DateAdditionTypes[DateAdditionTypes["days"] = 1] = "days";
})(DateAdditionTypes = exports.DateAdditionTypes || (exports.DateAdditionTypes = {}));
exports.merge = (...items) => {
    let result = {};
    for (let item of items) {
        result = Object.assign(Object.assign({}, result), item);
    }
    return result;
};
exports.addToDate = (date, count, inputType) => {
    switch (inputType) {
        case DateAdditionTypes.days:
            return new Date(date.setDate(date.getDate() + count));
        case DateAdditionTypes.seconds:
            return new Date(date.setSeconds(date.getSeconds() + count));
        default:
            return false;
    }
};
