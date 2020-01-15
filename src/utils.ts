export enum DateAdditionTypes {
  seconds,
  days
}

export const merge = (...items: Array<any>) => {
  let result = {}
  for (let item of items) {
    result = { ...result, ...item }
  }
  return result
}

export const addToDate = (date: Date, count: number, inputType: DateAdditionTypes) => {
  switch (inputType) {
    case DateAdditionTypes.days:
      return new Date(date.setDate(date.getDate() + count))
    case DateAdditionTypes.seconds:
      return new Date(date.setSeconds(date.getSeconds() + count))
    default:
      return false
  }
}