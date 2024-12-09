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
import { DEFAULT_SETTINGS, Settings } from 'models/settings'

export const SettingsContext = createContext<{
  settings: Settings
  setSetting: (key: string, value: boolean) => void
}>({
  settings: DEFAULT_SETTINGS,
  setSetting: (key: string, value: boolean): void => {},
})

export const useSettings = () => useContext(SettingsContext)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(
    () => {
      if (loaded === false) {
        setSettings({ ...DEFAULT_SETTINGS, ...getSettings() })
        setLoaded(true)
      }
    },
    [settings, loaded]
  )

  const setSetting = useCallback(
    (key: string, value: boolean) => {
      setSettings((oldSettings) => {
        let newSettings: Settings
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
