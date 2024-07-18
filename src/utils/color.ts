import toColor from '@mapbox/to-color'

const COLOR_OPTS = { brightness: 3.25, saturation: .25 }

export function getColorForSeed(seed: string): string {
  // @ts-ignore
  return new toColor(seed, COLOR_OPTS).getColor().hsl.formatted
}
