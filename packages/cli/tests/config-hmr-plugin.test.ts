import { describe, expect, it } from 'vitest'

import { shimConfigSource } from '../src/vite/config-hmr-plugin'

const SHIM = 'const defineConfig = (c) => c;'

describe('shimConfigSource', () => {
  it('replaces a single line CLI import', () => {
    const source = "import { defineConfig } from '@react-foundry/cli'"

    expect(shimConfigSource(source)).toBe(SHIM)
  })

  it('replaces a double quoted import', () => {
    const source = 'import { defineConfig } from "@react-foundry/cli"\n'

    expect(shimConfigSource(source)).toContain(SHIM)
    expect(shimConfigSource(source)).not.toContain('@react-foundry/cli')
  })

  // Long imports get wrapped by the formatter, so the braces span lines.
  it('replaces a multi-line CLI import', () => {
    const source = [
      'import {',
      '  defineConfig,',
      "} from '@react-foundry/cli'",
      '',
      'export default defineConfig({})',
    ].join('\n')

    const result = shimConfigSource(source)

    expect(result).toContain(SHIM)
    expect(result).not.toContain('@react-foundry/cli')
    expect(result).toContain('export default defineConfig({})')
  })

  it('replaces an import with a type specifier in the braces', () => {
    const source =
      "import { defineConfig, type FoundryConfig } from '@react-foundry/cli'\n"

    expect(shimConfigSource(source)).toContain(SHIM)
    expect(shimConfigSource(source)).not.toContain('@react-foundry/cli')
  })

  it('tolerates a trailing semicolon', () => {
    const source = "import { defineConfig } from '@react-foundry/cli';"

    expect(shimConfigSource(source)).toBe(SHIM)
  })

  it('leaves imports from other packages alone', () => {
    const source = "import { useState } from 'react'\n"

    expect(shimConfigSource(source)).toBe(source)
  })

  it('preserves the rest of the file', () => {
    const source = [
      "import { defineConfig } from '@react-foundry/cli'",
      '',
      'export default defineConfig({',
      "  title: 'Demo',",
      "  nav: [{ label: 'Forms' }],",
      '})',
    ].join('\n')

    const result = shimConfigSource(source)

    expect(result).toContain("title: 'Demo'")
    expect(result).toContain("nav: [{ label: 'Forms' }]")
  })

  // The replace is global so a config splitting its imports is fully shimmed;
  // any lingering CLI import would run the binary's entry point.
  it('replaces every CLI import when there is more than one', () => {
    const source = [
      "import { defineConfig } from '@react-foundry/cli'",
      "import { something } from '@react-foundry/cli'",
    ].join('\n')

    expect(shimConfigSource(source)).not.toContain('@react-foundry/cli')
  })
})
