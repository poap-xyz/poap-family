import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useState } from 'react'
import { getSettings, saveSettings } from 'loaders/settings'
import { DEFAULT_SETTINGS } from 'models/settings'

export const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  /**
   * @type {(key: string, value: boolean) => void}
   */
  set: (key, value) => {},
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

  /**
   * @param {string} key
   * @param {boolean} value
   */
  const set = (key, value) => {
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
  }

  return (
    <SettingsContext.Provider value={{ settings, set }}>
      {children}
    </SettingsContext.Provider>
  )
}

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
