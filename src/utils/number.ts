import numbro from 'numbro'

export function formatStat(n: string | number): string {
  return numbro(n).format({ thousandSeparated: false })
}

export function formatPercentage(n: string | number): string {
  return numbro(n).format({ mantissa: 0, output: 'percent' })
}

export function formatByte(n: string | number): string {
  return numbro(n).format({ output: 'byte', base: 'binary', mantissa: 0 })
}

/**
 * Return a random number between two numbers.
 * The maximum is exclusive and the minimum is inclusive.
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
