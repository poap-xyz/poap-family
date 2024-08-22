export function intersection(array) {
  const result = []
  const argsLength = arguments.length
  for (var i = 0, length = array.length; i < length; i++) {
    const item = array[i]
    if (result.indexOf(item) !== -1) {
      continue
    }
    let j
    for (j = 1; j < argsLength; j++) {
      if (arguments[j].indexOf(item) === -1) {
        break
      }
    }
    if (j === argsLength) {
      result.push(item)
    }
  }
  return result
}
