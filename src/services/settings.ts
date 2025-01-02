import { DEFAULT_SETTINGS, Settings } from 'models/settings'

export function getSettings(): Settings {
  const cachedSettings = localStorage.getItem('family-settings')
  if (!cachedSettings) {
    return DEFAULT_SETTINGS
  }
  let settings: unknown
  try {
    settings = JSON.parse(cachedSettings)
  } catch (err: unknown) {
    console.error(err)
    localStorage.removeItem('family-settings')
    return DEFAULT_SETTINGS
  }
  if (!settings || typeof settings !== 'object') {
    localStorage.removeItem('family-settings')
    return DEFAULT_SETTINGS
  }
  return settings as Settings
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('family-settings', JSON.stringify(settings))
  } catch (err: unknown) {
    console.error(err)
  }
}
