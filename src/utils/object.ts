export function fillNull<T extends object>(obj: T, keys: string[], value: T[keyof T]): T {
  const cloned = Object.assign({}, obj)
  for (const key of keys) {
    if (!(key in obj) || obj[key] == null) {
      cloned[key] = value
    }
  }
  return cloned
}
