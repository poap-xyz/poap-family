import { createContext, useCallback, useMemo, useState } from 'react'
import { auth } from '../loaders/api'

export const AdminContext = createContext({
  authenticated: false,
  passphrase: null,
  loading: false,
  error: null,
  authenticate: () => {},
  reset: () => {},
})

export function AdminProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [authenticated, setAuthenticated] = useState(false)

  /**
   * @type {ReturnType<typeof useState<string | null>>}
   */
  const [passphrase, setPassphrase] = useState(null)

  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)

  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)

  const authenticate = useCallback(
    (passphrase) => {
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
      setError(false)
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
