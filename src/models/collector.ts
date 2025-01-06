import { Drop, parseDrop } from 'models/drop'
import { isAddress } from 'models/address'

export const DEFAULT_COLLECTOR_LIMIT = 100

export function parseCollectorAddress(data: unknown): string {
  if (
    !data ||
    typeof data !== 'object' ||
    !('collector_address' in data) ||
    data.collector_address == null ||
    !isAddress(data.collector_address)
  ) {
    throw new Error('Invalid collector')
  }

  return data.collector_address
}

export function parseColectorDrop(
  data: unknown,
  includeDescription: boolean,
): Drop {
  if (
    !data ||
    typeof data !== 'object' ||
    !('drop' in data) ||
    !data.drop ||
    typeof data.drop !== 'object'
  ) {
    throw new Error('Invalid collector drop')
  }

  return parseDrop(data.drop, includeDescription)
}

export function parseCollectors(data: unknown): string[] {
  if (
    data == null ||
    !Array.isArray(data) ||
    !data.every(
      (collector: unknown): collector is string => isAddress(collector)
    )
  ) {
    throw new Error('Invalid collectors')
  }
  return data
}
