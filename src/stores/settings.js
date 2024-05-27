import PropTypes from 'prop-types'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSettings, saveSettings } from 'loaders/settings'
import { DEFAULT_SETTINGS } from 'models/settings'

export const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  /**
   * @type {(key: string, value: boolean) => void}
   */
  setSetting: (key, value) => {},
})

export const useSettings = () => useContext(SettingsContext)

/**
 * @param {PropTypes.InferProps<SettingsProvider.propTypes>} props
 */
export function SettingsProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<typeof DEFAULT_SETTINGS>>}
   */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(
    () => {
      if (settings === null) {
        setSettings({ ...DEFAULT_SETTINGS, ...getSettings() })
      }
    },
    [settings]
  )

  const setSetting = useCallback(
    /**
     * @param {string} key
     * @param {boolean} value
     */
    (key, value) => {
      setSettings((oldSettings) => {
        /**
         * @type {typeof DEFAULT_SETTINGS}
         */
        let newSettings
        if (oldSettings) {
          newSettings = { ...oldSettings, [key]: value }
        } else {
          newSettings = { ...DEFAULT_SETTINGS, [key]: value }
        }
        saveSettings(newSettings)
        return newSettings
      })
    },
    []
  )

  const value = useMemo(
    () => ({ settings, setSetting }),
    [settings, setSetting]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
