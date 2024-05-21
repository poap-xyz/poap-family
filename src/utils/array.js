/**
 * Returns elements found in all array arguments.
 *
 * @template T
 * @param {...T[]} array
 */
export function intersection(array) {
  if (array == null) {
    return []
  }
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

/**
 * @template T
 * @param {...T[]} arrays
 * @returns {T[]}
 */
export function union() {
  /**
   * @type {Set<T>}
   */
  const all = new Set()
  for (let i = 0; i < arguments.length; i++) {
    const arg = arguments[i]
    if (Array.isArray(arg)) {
      /**
       * @type {T[]}
       */
      const array = arg.flat()
      for (const item of array) {
        all.add(item)
      }
    } else {
      all.add(arg)
    }
  }
  return [...all]
}

/**
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function uniq(array) {
  return [...new Set([...array])]
}

/**
 * Returns true when {a} and {b} are equal no matter their order.
 *
 * @param {unknown[]} a
 * @param {unknown[]} b
 */
export function equals(a, b) {
  if (a === b) {
    return true
  }
  if (a == null || b == null) {
    return false
  }
  if (a.length !== b.length) {
    return false
  }

  let aCopy = a.slice()
  let bCopy = b.slice()

  aCopy.sort()
  bCopy.sort()

  for (let i = 0; i < aCopy.length; i++) {
    if (aCopy[i] !== bCopy[i]) {
      return false
    }
  }
  return true
}

/**
 * Split an array into smaller chunks.
 *
 * @template T
 * @param {T[]} array
 * @param {number} len
 */
export function chunks(array, len = 1) {
  const chunks = []
  let i = 0

  while (i < array.length) {
    chunks.push(array.slice(i, i += len))
  }

  return chunks
}
