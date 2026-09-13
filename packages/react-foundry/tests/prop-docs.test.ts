import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createPropDocsService, type PropDocsService } from '../src/vite/prop-docs'

/**
 * A small project on disk: a component with documented props, and a preview file
 * binding schemas to it every way the docs reader has to follow. No JSX and no
 * resolvable `react-foundry`, on purpose: the reader works from the syntax of the
 * preview file and the types of the component, and neither needs foundry's own
 * types to be in reach of the file.
 */
const component = `
export interface ButtonProps {
  /** Which look the button takes. */
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'large'
  disabled?: boolean
  /** The button's text. */
  children: string
  onClick?: () => void
}

export const Button = (_props: ButtonProps) => null
`

const shared = `
import { controlsFor } from 'react-foundry'
import { Button } from './button'

export const sharedControls = controlsFor(Button, { size: { type: 'radio', options: ['small'] } })
`

const preview = `
import { controlsFor, createPreview, defineControls } from 'react-foundry'
import { Button } from './button'
import { sharedControls } from './shared'

const buttonControls = controlsFor(Button, {
  variant: { type: 'select', options: ['primary', 'danger'] },
  disabled: { type: 'boolean' },
})

export const Playground = createPreview({ controls: buttonControls, render: () => null })

export const Inline = createPreview({
  controls: controlsFor(Button, { size: { type: 'radio', options: ['small'] } }),
  render: () => null,
})

export const Spread = createPreview({
  controls: controlsFor(Button, { ...buttonControls, children: { type: 'text' } }),
  render: () => null,
})

export const Imported = createPreview({ controls: sharedControls, render: () => null })

export const Unbound = createPreview({
  controls: defineControls({ tags: { type: 'text' } }),
  render: () => null,
})

export const Bare = createPreview(() => null)

export const Mistyped = createPreview({
  controls: controlsFor(Button, { bogus: { type: 'text' } }),
  render: () => null,
})
`

describe('prop docs', () => {
  let dir: string
  let file: string
  let service: PropDocsService

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-prop-docs-'))
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          target: 'ES2020',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
        },
      })
    )
    writeFileSync(join(dir, 'button.tsx'), component)
    writeFileSync(join(dir, 'shared.ts'), shared)
    file = join(dir, 'button.preview.tsx')
    writeFileSync(file, preview)

    const created = createPropDocsService(dir, () => [file])
    if (!created) throw new Error('typescript not found')
    service = created
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('documents each control from the component prop it drives', () => {
    const docs = service.docsFor(file)

    expect(docs.Playground).toEqual({
      variant: {
        name: 'variant',
        type: "'primary' | 'secondary' | 'danger'",
        optional: true,
        description: 'Which look the button takes.',
      },
      disabled: { name: 'disabled', type: 'boolean', optional: true },
    })
  })

  it('follows a schema written inline in the preview', () => {
    expect(service.docsFor(file).Inline).toEqual({
      size: { name: 'size', type: "'small' | 'large'", optional: true },
    })
  })

  it('follows a spread of one schema into another', () => {
    expect(Object.keys(service.docsFor(file).Spread ?? {}).sort()).toEqual([
      'children',
      'disabled',
      'variant',
    ])
    expect(service.docsFor(file).Spread?.children).toEqual({
      name: 'children',
      type: 'string',
      optional: false,
      description: "The button's text.",
    })
  })

  it('follows a schema imported from another file', () => {
    expect(service.docsFor(file).Imported).toEqual({
      size: { name: 'size', type: "'small' | 'large'", optional: true },
    })
  })

  // defineControls binds no component, and a bare preview has no controls at
  // all; neither has a prop to document.
  it('documents nothing for a preview without a bound component', () => {
    const docs = service.docsFor(file)

    expect(docs.Unbound).toBeUndefined()
    expect(docs.Bare).toBeUndefined()
  })

  it('skips a key that is not a prop, leaving the rest', () => {
    expect(service.docsFor(file).Mistyped).toEqual({})
  })

  it('returns nothing for a file it does not know', () => {
    expect(service.docsFor(join(dir, 'missing.preview.tsx'))).toEqual({})
  })
})
