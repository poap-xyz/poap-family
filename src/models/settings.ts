export const DEFAULT_SETTINGS = {
  welcomeShown: false,
  feedbackShown: false,

  showLastEvents: true,
}

export interface Settings {
  welcomeShown: boolean
  feedbackShown: boolean
  showLastEvents: boolean
}
