import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getSettings, saveSettings } from 'loaders/settings'
import { DEFAULT_SETTINGS } from 'models/settings'

export const SettingsContext = createContext<{
  settings: typeof DEFAULT_SETTINGS
  setSetting: (key: string, value: boolean) => void
}>({
  settings: DEFAULT_SETTINGS,
  setSetting: (key: string, value: boolean): void => {},
})

export const useSettings = () => useContext(SettingsContext)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<typeof DEFAULT_SETTINGS>(DEFAULT_SETTINGS)

  useEffect(
    () => {
      if (settings === null) {
        setSettings({ ...DEFAULT_SETTINGS, ...getSettings() })
      }
    },
    [settings]
  )

  const setSetting = useCallback(
    (key: string, value: boolean) => {
      setSettings((oldSettings) => {
        let newSettings: typeof DEFAULT_SETTINGS
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
