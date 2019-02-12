export const merge = (...items: Array<any>) => {
  let result = {}
  for (let item of items) {
    result = { ...item }
  }
  return result
}