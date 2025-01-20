import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Drop, DROPS_LIMIT } from 'models/drop'
import { AbortedError, filterAbortedErrors } from 'models/error'
import { fetchDropsOrErrors } from 'services/drops'
import { chunks } from 'utils/array'

export const DropsContext = createContext<{
  isLoading: boolean
  loading: Record<number, boolean>
  errors: Record<number, Error>
  error: Error | null
  drops: Record<number, Drop>
  fetchDrops: (dropIds: number[]) => () => void
  retryDrops: (dropIds: number[]) => void
}>({
  isLoading: false,
  loading: {},
  errors: {},
  error: null,
  drops: {},
  fetchDrops: () => () => {},
  retryDrops: () => {},
})

export const useDrops = () => useContext(DropsContext)

export function DropsProvider({
  children,
  batchSize = DROPS_LIMIT,
}: {
  children: ReactNode,
  batchSize?: number
}) {
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, Error>>({})
  const [error, setError] = useState<Error | null>(null)
  const [drops, setDrops] = useState<Record<number, Drop>>({})

  const addDrops = (newDrops: Record<number, Drop>): void => {
    setDrops((prevDrops) => ({
      ...prevDrops,
      ...newDrops,
    }))
  }

  const addErrors = (newErrors: Record<number, Error>): void => {
    const filteredNewErrors = filterAbortedErrors(newErrors)

    setErrors((prevErrors) => ({
      ...prevErrors,
      ...filteredNewErrors,
    }))
  }

  const delErrors = (dropIds: number[]): void => {
    setErrors((prevErrors) => Object.fromEntries(
      Object.entries(prevErrors).filter(
        ([rawDrawId]) => !dropIds.includes(parseInt(rawDrawId))
      )
    ))
  }

  const addLoading = (dropIds: number[]): void => {
    const newLoadings = Object.fromEntries(
      dropIds.map((dropId) => [dropId, true])
    )

    setLoading((prevLoadings) => ({
      ...prevLoadings,
      ...newLoadings,
    }))
  }

  const delLoading = (dropIds: number[]): void => {
    setLoading((prevLoadings) => Object.fromEntries(
      Object.entries(prevLoadings).filter(
        ([rawDrawId, isLoading]) =>
          !isLoading || !dropIds.includes(parseInt(rawDrawId))
      )
    ))
  }

  const isLoading = useMemo(
    () => Object
      .entries(loading)
      .filter(([, isLoading]) => isLoading)
      .length > 0,
    [loading]
  )

  const fetchDrops = useCallback(
    (dropIds: number[]): () => void => {
      if (dropIds.length === 0) {
        setError(new Error('No drops to fetch'))
        return () => {}
      }

      addLoading(dropIds)
      setError(null)

      const batches = chunks(dropIds, batchSize)
      const controllers = batches.map(() => new AbortController())

      let sequential = new Promise<void>((r) => r())

      for (let i = 0; i < batches.length; i++) {
        const batchDropIds = batches[i]
        const controller = controllers[i]

        const fetchDropsAndStore = () =>
          fetchDropsOrErrors(
            batchDropIds,
            /*includeDescription*/false,
            controller.signal
          ).then(([drops, errors]) => {
            addErrors(errors)
            addDrops(drops)
          })

        sequential = sequential.then(fetchDropsAndStore, fetchDropsAndStore)
      }

      sequential.catch((err) => {
        if (err instanceof AbortedError) {
          return
        }
        const error = err instanceof Error ? err : new Error(
          'Cannot fetch drops',
          { cause: err }
        )
        setError(error)
      }).finally(() => {
        delLoading(dropIds)
      })

      return () => {
        for (const controller of controllers) {
          controller.abort()
        }
      }
    },
    [batchSize]
  )

  const retryDrops = useCallback(
    (dropIds: number[]): void => {
      delErrors(dropIds)
    },
    []
  )

  const value = useMemo(
    () => ({
      isLoading,
      loading,
      errors,
      error,
      drops,
      fetchDrops,
      retryDrops,
    }),
    [
      isLoading,
      loading,
      errors,
      error,
      drops,
      fetchDrops,
      retryDrops,
    ]
  )

  return (
    <DropsContext.Provider value={value}>
      {children}
    </DropsContext.Provider>
  )
}
