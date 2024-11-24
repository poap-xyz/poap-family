export interface DownloadProgress {
  progress: number
  rate: number | null
  estimated: number | null
}

export interface CountProgress {
  count: number
  total: number
}
