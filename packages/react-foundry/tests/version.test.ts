import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { readPackageVersion } from '../src/version'

const manifest = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf-8')
) as { version: string }

describe('readPackageVersion', () => {
  // The literal it replaced sat at 0.0.1 through nine releases, so `foundry --version`
  // could not pin a bug report to a build. Reading the manifest is what keeps the two
  // from drifting again.
  it('reports the version the package actually publishes', () => {
    expect(readPackageVersion()).toBe(manifest.version)
  })

  // Guards the relative path: a wrong one falls back to 'unknown' rather than throwing,
  // which would otherwise pass unnoticed.
  it('resolves the manifest rather than falling back', () => {
    expect(readPackageVersion()).not.toBe('unknown')
    expect(readPackageVersion()).toMatch(/^\d+\.\d+\.\d+/)
  })
})
