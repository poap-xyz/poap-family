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
