/**
 * Returns elements found in all array arguments.
 */
export function intersection<T>(array: T[], ...args: T[][]): T[] {
  if (array == null) {
    return []
  }
  const result = []
  for (var i = 0, length = array.length; i < length; i++) {
    const item = array[i]
    if (result.indexOf(item) !== -1) {
      continue
    }
    let j: number
    for (j = 0; j < args.length; j++) {
      if (args[j].indexOf(item) === -1) {
        break
      }
    }
    if (j === args.length - 1) {
      result.push(item)
    }
  }
  return result
}

export function union<T>(...args: T[][]): T[] {
  const all = new Set<T>()
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (Array.isArray(arg)) {
      const array: T[] = [].concat(...arg)
      for (const item of array) {
        all.add(item)
      }
    } else {
      all.add(arg)
    }
  }
  return [...all]
}

export function uniq<T>(array: T[]): T[] {
  return [...new Set([...array])]
}

/**
 * Returns true when {a} and {b} are equal no matter their order.
 */
export function equals(a: unknown[], b: unknown[]): boolean {
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
 */
export function chunks<T>(array: T[], len: number = 1): T[][] {
  const chunks: T[][] = []
  let i = 0

  while (i < array.length) {
    chunks.push(array.slice(i, i += len))
  }

  return chunks
}
