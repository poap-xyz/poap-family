import { useCallback, useState } from 'react'
import { scanAddress } from 'loaders/poap'

/**
 * @param {string} address
 * @returns {{
 *   loadingAddressTokens: boolean
 *   addressTokensError: Error | null
 *   tokens: Awaited<ReturnType<typeof scanAddress>> | null
 *   fetchTokens: () => void
 *   cancelAddressTokens: () => void
 * }}
 */
function useAddressTokens(address) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<AbortController | null>>}
   */
  const [controller, setController] = useState(null)
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
      setController(controller)
      scanAddress(address, controller.signal).then(
        (foundPOAPs) => {
          setLoading(false)
          setController(null)
          setPOAPs(foundPOAPs)
        },
        (err) => {
          setLoading(false)
          setController(null)
          setError(err)
          setPOAPs(null)
        }
      )
    },
    [address]
  )

  const cancelAddressTokens = useCallback(
    () => {
      if (controller) {
        controller.abort()
      }
      setLoading(false)
      setController(null)
      setError(null)
      setPOAPs(null)
    },
    [controller]
  )

  return {
    loadingAddressTokens: loading,
    addressTokensError: error,
    tokens: poaps,
    fetchTokens,
    cancelAddressTokens,
  }
}

export default useAddressTokens
