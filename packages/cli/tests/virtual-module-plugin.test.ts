import { describe, expect, it } from 'vitest'

import { globBaseDir, parseExportOrder } from '../src/vite/virtual-module-plugin'

describe('parseExportOrder', () => {
  it('returns nothing for a file with no exports', () => {
    expect(parseExportOrder('const x = 1\n')).toEqual([])
  })

  // The whole reason this parser exists: `import * as m` sorts its keys
  // alphabetically per the ES spec, so authored order is unrecoverable at
  // runtime. A regression to Object.keys would pass an alphabetical fixture.
  it('preserves source order rather than alphabetical order', () => {
    const source = [
      'export const Zulu = createPreview(() => <div />)',
      'export const Alpha = createPreview(() => <div />)',
      'export const Mike = createPreview(() => <div />)',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['Zulu', 'Alpha', 'Mike'])
  })

  it('reads exported function declarations', () => {
    expect(parseExportOrder('export function Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported async functions', () => {
    expect(parseExportOrder('export async function Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported generator functions', () => {
    expect(parseExportOrder('export function* Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported classes', () => {
    expect(parseExportOrder('export class Primary {}\n')).toEqual(['Primary'])
  })

  it('reads let and var exports alongside const', () => {
    const source = 'export const A = 1\nexport let B = 2\nexport var C = 3\n'

    expect(parseExportOrder(source)).toEqual(['A', 'B', 'C'])
  })

  it('handles a declaration whose value spans multiple lines', () => {
    const source = [
      'export const Primary = createPreview({',
      "  label: 'Primary',",
      '  render: () => <Button />,',
      '})',
      'export const Danger = createPreview(() => <Button />)',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['Primary', 'Danger'])
  })

  it('picks up the nav export, which discovery filters out later', () => {
    const source =
      "export const nav: NavPath = 'Forms/Button'\nexport const Primary = p()\n"

    expect(parseExportOrder(source)).toEqual(['nav', 'Primary'])
  })

  it('ignores default exports, which are never previews', () => {
    const source = 'export default createPreview(() => <div />)\nexport const A = 1\n'

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores re-export lists', () => {
    const source = "export { Primary } from './other'\nexport const A = 1\n"

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores star re-exports', () => {
    const source = "export * from './other'\nexport const A = 1\n"

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  // Types are erased, so they are never keys on the runtime module namespace.
  it('ignores type and interface exports', () => {
    const source = [
      'export type Foo = string',
      'export interface Bar { a: string }',
      'export const A = 1',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores exports that are not at the start of a line', () => {
    const source = '// export const Commented = 1\nexport const Real = 2\n'

    expect(parseExportOrder(source)).toEqual(['Real'])
  })

  it('accepts identifiers with underscores and dollar signs', () => {
    const source = 'export const _private = 1\nexport const $special = 2\n'

    expect(parseExportOrder(source)).toEqual(['_private', '$special'])
  })
})

describe('globBaseDir', () => {
  it('stops at the first segment containing a wildcard', () => {
    expect(globBaseDir('/proj/src/components/**/*.preview.tsx')).toBe(
      '/proj/src/components'
    )
  })

  it('handles a wildcard in the filename only', () => {
    expect(globBaseDir('/proj/src/*.preview.tsx')).toBe('/proj/src')
  })

  it('handles brace expansion', () => {
    expect(globBaseDir('/proj/src/{a,b}/*.tsx')).toBe('/proj/src')
  })

  it('handles character classes', () => {
    expect(globBaseDir('/proj/src/[ab]/*.tsx')).toBe('/proj/src')
  })

  it('drops the filename when the pattern has no wildcard at all', () => {
    expect(globBaseDir('/proj/src/button.preview.tsx')).toBe('/proj/src')
  })
})
