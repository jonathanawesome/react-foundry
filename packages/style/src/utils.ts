export function arrayToKebabString(arr: string[]): string {
  return arr
    .map((seg) => seg.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
    .reduce((acc, seg) => `${acc}-${seg}`, '')
}

/**
 * Detects whether a color string is a raw OKLCH triplet (e.g. '62.1% 0.289482 350.9')
 * versus a complete CSS color value (e.g. '#ff0000', 'red', 'oklch(62.1% 0.289482 350.9)').
 */
export function isRawOklchTriplet(value: string): boolean {
  return /^[\d.%\s]+$/.test(value.trim())
}

/**
 * Creates a CSS color string with alpha transparency.
 * For raw OKLCH triplets, uses native oklch() alpha syntax.
 * For any other CSS color, uses color-mix() for broad format support.
 */
export function colorWithAlpha(value: string, alpha: number): string {
  if (isRawOklchTriplet(value)) {
    return `oklch(${value} / ${alpha})`
  }
  return `color-mix(in oklab, ${value} ${Math.round(alpha * 100)}%, transparent)`
}

export const transformColors = <T extends Record<string, string>>(colorTheme: T) => {
  return Object.fromEntries(
    Object.entries(colorTheme).map(([key, value]) => [
      key,
      isRawOklchTriplet(value) ? `oklch(${value})` : value,
    ])
  ) as { [K in keyof T]: string }
}
