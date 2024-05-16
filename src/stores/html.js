import PropTypes from 'prop-types'
import { createContext, useCallback, useMemo, useState } from 'react'

export const HTMLContext = createContext({
  /**
   * @type {string}
   */
  title: 'POAP Family',
  /**
   * @type {(title: string) => void}
   */
  setTitle: (title) => {},
})

/**
 * @param {PropTypes.InferProps<HTMLProvider.propTypes>} props
 */
export function HTMLProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [title, setTitle] = useState('POAP Family')

  const setFamilyTitle = useCallback(
    /**
     * @param {string} title
     */
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

HTMLProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
