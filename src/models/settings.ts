export const DEFAULT_SETTINGS = {
  welcomeShown: false,
  feedbackShown: false,

  showLastEvents: true,
  autoScrollCollectors: true,
  openProfiles: true,
  showCollections: true,
}

export interface Settings {
  welcomeShown: boolean
  feedbackShown: boolean
  showLastEvents: boolean
  autoScrollCollectors: boolean
  openProfiles: boolean
  showCollections: boolean
}
