import { DEFAULT_SETTINGS } from '../models/cache'

function getSettings() {
  const cachedSettings = localStorage.getItem('family-settings')
  if (!cachedSettings) {
    return DEFAULT_SETTINGS
  }
  let settings
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
  return settings
}

function saveSettings(settings) {
  try {
    localStorage.setItem('family-settings', JSON.stringify(settings))
  } catch (err) {
    console.error(err)
  }
}

export {
  getSettings,
  saveSettings,
}
