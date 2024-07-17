import { createContext, ReactNode, useCallback, useMemo, useState } from 'react'
import { auth } from 'loaders/api'

export const AdminContext = createContext<{
  authenticated: boolean
  passphrase: string | null
  loading: boolean
  error: Error | null
  authenticate: (passphrase: string) => void
  reset: () => void
}>({
  authenticated: false,
  passphrase: null,
  loading: false,
  error: null,
  authenticate: (passphrase: string): void => {},
  reset: () => {},
})

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [passphrase, setPassphrase] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const authenticate = useCallback(
    (passphrase: string) => {
      setLoading(true)
      setPassphrase(passphrase)
      auth(passphrase).then(
        () => {
          setLoading(false)
          setAuthenticated(true)
        },
        (err) => {
          setLoading(false)
          setAuthenticated(false)
          setError(err)
        }
      )
    },
    []
  )

  const reset = useCallback(
    () => {
      setPassphrase(null)
      setError(null)
    },
    []
  )

  const value = useMemo(
    () => ({
      authenticated,
      passphrase,
      loading,
      error,
      authenticate,
      reset,
    }),
    [
      authenticated,
      passphrase,
      loading,
      error,
      authenticate,
      reset,
    ]
  )

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}
