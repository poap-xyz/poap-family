import { createContext, ReactNode, useCallback, useMemo, useState } from 'react'

export const HTMLContext = createContext<{
  title: string
  setTitle: (title: string) => void
}>({
  title: 'POAP Family',
  setTitle: (title: string): void => {},
})

export function HTMLProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string>('POAP Family')

  const setFamilyTitle = useCallback(
    (title: string) => setTitle(`POAP Family${title ? `: ${title}` : ''}`),
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
