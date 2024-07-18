/**
 * Get an URL search param as a number or a default value when is not present
 * or is not a number.
 */
export function getSearchParamNumber(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number,
): number {
  if (searchParams.has(key)) {
    const value = searchParams.get(key)
    if (value != null) {
      const n = parseInt(value)
      if (!isNaN(n)) {
        return n
      }
    }
  }
  return defaultValue
}
