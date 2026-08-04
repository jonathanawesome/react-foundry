import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appDir = resolve(import.meta.dirname, '../src/app')

const appSources = readdirSync(appDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  .map((file) => ({ file, source: readFileSync(resolve(appDir, file), 'utf8') }))

describe('the app tree', () => {
  it('has sources to check', () => {
    expect(appSources.length).toBeGreaterThan(0)
  })

  // This tree is copied to dist/app verbatim and compiled by the consumer's Vite, so
  // every bare specifier in it is one their resolver has to satisfy. Router values come
  // from @react-foundry/ui instead, which published consumers alias to the client bundle
  // with the router inlined. Strict about type imports too: a type the tree needs should
  // be added to the ui re-export rather than reopening this channel.
  it('imports nothing from @tanstack', () => {
    const offenders = appSources
      .filter(({ source }) => /\bfrom\s+'@tanstack\//.test(source))
      .map(({ file }) => file)

    expect(offenders).toEqual([])
  })

  // The one permitted mention. `declare module` is erased at transform, so it never
  // reaches the consumer's resolver, and dropping it would untype Link and useMatch
  // across the whole shell.
  it('still registers the router type', () => {
    const main = appSources.find(({ file }) => file === 'main.tsx')

    expect(main?.source).toContain("declare module '@tanstack/react-router'")
  })
})
