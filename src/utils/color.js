import toColor from '@mapbox/to-color'

const COLOR_OPTS = { brightness: 3.25, saturation: .25 }

/**
 * @param {string} seed
 * @returns {string}
 */
export function getColorForSeed(seed) {
  // @ts-ignore
  return new toColor(seed, COLOR_OPTS).getColor().hsl.formatted
}
