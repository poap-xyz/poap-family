export const DEFAULT_SETTINGS = {
  welcomeShown: false,
  feedbackShown: false,

  showLastEvents: true,
  openProfiles: true,
  showCollections: true,
}

export interface Settings {
  welcomeShown: boolean
  feedbackShown: boolean
  showLastEvents: boolean
  openProfiles: boolean
  showCollections: boolean
}
