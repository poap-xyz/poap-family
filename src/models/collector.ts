export const DEFAULT_COLLECTOR_LIMIT = 100

export function parseCollector(data: unknown): string {
  if (
    !data ||
    typeof data !== 'object' ||
    !('collector_address' in data) ||
    !data.collector_address ||
    typeof data.collector_address !== 'string'
  ) {
    throw new Error('Invalid collector')
  }

  return data.collector_address
}
