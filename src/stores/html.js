import { createContext, useCallback, useMemo, useState } from 'react'

const HTMLContext = createContext({
  title: 'POAP Family',
})

function HTMLProvider({ children }) {
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

export { HTMLContext, HTMLProvider }
