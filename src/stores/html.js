import { createContext, useCallback, useMemo, useState } from 'react'

export const HTMLContext = createContext({
  title: 'POAP Family',
})

export function HTMLProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [title, setTitle] = useState('POAP Family')

  const setFamilyTitle = useCallback(
    (title) => setTitle(`POAP Family${title ? `: ${title}` : ''}`),
    []
  )

  const value = useMemo(
    () => ({
      title,
      setTitle: setFamilyTitle,
    }),
    [title, setFamilyTitle]
  )

  return (
    <HTMLContext.Provider value={value}>
      {children}
    </HTMLContext.Provider>
  )
}
