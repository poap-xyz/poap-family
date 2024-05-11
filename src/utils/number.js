import numbro from 'numbro'

export function formatStat(n) {
  return numbro(n).format({ thousandSeparated: false })
}

export function formatPercentage(n) {
  return numbro(n).format({ mantissa: 0, output: 'percent' })
}

export function formatByte(n) {
  return numbro(n).format({ output: 'byte', base: 'binary', mantissa: 0 })
}

/**
 * Return a random number between two numbers.
 * The maximum is exclusive and the minimum is inclusive.
 *
 * @param {number} min
 * @param {number} max
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
