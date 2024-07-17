import { DEFAULT_SETTINGS } from 'models/settings'

export function getSettings(): typeof DEFAULT_SETTINGS {
  const cachedSettings = localStorage.getItem('family-settings')
  if (!cachedSettings) {
    return DEFAULT_SETTINGS
  }
  let settings: unknown
  try {
    settings = JSON.parse(cachedSettings)
  } catch (err) {
    console.error(err)
    localStorage.removeItem('family-settings')
    return DEFAULT_SETTINGS
  }
  if (!settings || typeof settings !== 'object') {
    localStorage.removeItem('family-settings')
    return DEFAULT_SETTINGS
  }
  return settings as typeof DEFAULT_SETTINGS
}

export function saveSettings(settings: typeof DEFAULT_SETTINGS) {
  try {
    localStorage.setItem('family-settings', JSON.stringify(settings))
  } catch (err) {
    console.error(err)
  }
}
