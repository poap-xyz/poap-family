import PropTypes from 'prop-types'
import { createContext, useEffect, useState } from 'react'
import { getSettings, saveSettings } from 'loaders/cache'
import { DEFAULT_SETTINGS } from 'models/cache'

export const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  /**
   * @type {(key: string, value: boolean) => void}
   */
  set: (key, value) => {},
})

/**
 * @param {PropTypes.InferProps<SettingsProvider.propTypes>} props
 */
export function SettingsProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<typeof DEFAULT_SETTINGS | null>>}
   */
  const [settings, setSettings] = useState(null)

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
      const newSettings = { ...oldSettings, [key]: value }
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
