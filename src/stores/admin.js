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
  const [authenticated, setAuthenticated] = useState(false)
  const [passphrase, setPassphrase] = useState(null)
  const [loading, setLoading] = useState(false)
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
