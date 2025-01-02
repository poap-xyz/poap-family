import { useCallback, useState } from 'react'
import { fetchCollectorPOAPs } from 'services/collectors'
import { POAP } from 'models/poap'

function useAddressTokens(address: string): {
  loadingAddressTokens: boolean
  addressTokensError: Error | null
  tokens: POAP[] | null
  fetchTokens: () => () => void
} {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [poaps, setPOAPs] = useState<POAP[] | null>(null)

  const fetchTokens = useCallback(
    () => {
      const controller = new AbortController()
      setLoading(true)
      fetchCollectorPOAPs(address, controller.signal).then(
        (foundPOAPs) => {
          setLoading(false)
          setPOAPs(foundPOAPs)
        },
        (err: unknown) => {
          setLoading(false)
          if (err instanceof Error) {
            setError(err)
          } else {
            setError(new Error(`Could not fetch tokens for ${address}`, {
              cause: err,
            }))
          }
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
