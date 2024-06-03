import { useCallback, useState } from 'react'
import { scanAddress } from 'loaders/poap'

/**
 * @param {string} address
 * @returns {{
 *   loadingAddressTokens: boolean
 *   addressTokensError: Error | null
 *   tokens: Awaited<ReturnType<typeof scanAddress>> | null
 *   fetchTokens: () => () => void
 * }}
 */
function useAddressTokens(address) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Awaited<ReturnType<typeof scanAddress>> | null>>}
   */
  const [poaps, setPOAPs] = useState(null)

  const fetchTokens = useCallback(
    () => {
      const controller = new AbortController()
      setLoading(true)
      scanAddress(address, controller.signal).then(
        (foundPOAPs) => {
          setLoading(false)
          setPOAPs(foundPOAPs)
        },
        (err) => {
          setLoading(false)
          setError(err)
          setPOAPs(null)
        }
      )
      return () => {
        if (controller) {
          controller.abort()
        }
        setLoading(false)
        setError(null)
        setPOAPs(null)
      }
    },
    [address]
  )

  return {
    loadingAddressTokens: loading,
    addressTokensError: error,
    tokens: poaps,
    fetchTokens,
  }
}

export default useAddressTokens
