/**
 * Get an URL search param as a number or a default value when is not present
 * or is not a number.
 *
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {number} defaultValue
 */
export function getSearchParamNumber(searchParams, key, defaultValue) {
  if (searchParams.has(key)) {
    const n = parseInt(searchParams.get(key))
    if (!isNaN(n)) {
      return n
    }
  }
  return defaultValue
}
