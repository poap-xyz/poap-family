import { createContext, useEffect, useState } from 'react'
import { getSettings, saveSettings } from '../loaders/cache'
import { DEFAULT_SETTINGS } from '../models/cache'

export const SettingsContext = createContext(DEFAULT_SETTINGS)

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
