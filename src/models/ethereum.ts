export const MAINNET_PROVIDER_URL = `https://public-eth-node.poap.tech/${process.env.REACT_APP_POAP_NODE_API_KEY}`
export const MAINNET_ENS_REVERSE_RECORDS = '0x1FeD6981924600aCAc3d0F5f81fe88aEcc52b86C' // 0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C

export const ENS_REVERSE_RECORDS_BATCH_SIZE = 100
export const ENS_RESOLVE_BATCH_SIZE = 6
export const ENS_RESOLVE_MAX_ERRORS = 100

export type EnsByAddress = Record<string, string | null>

export interface EnsMeta {
  avatar: string | null
}
