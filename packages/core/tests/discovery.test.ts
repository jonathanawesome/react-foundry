import { describe, expect, it } from 'vitest'

import { createDiscovery } from '../src/discovery'
import type { ComponentPreview, PreviewModule } from '../src/types'

/** Helper to build a preview module without repeating the required `component` field */
function previewModule(preview: Partial<ComponentPreview>): PreviewModule {
  return {
    default: {
      title: 'Untitled',
      component: () => null,
      ...preview,
    },
  }
}

describe('createDiscovery', () => {
  it('returns an empty array when there are no preview modules', () => {
    expect(createDiscovery({})()).toEqual([])
  })

  it('derives the id from the filename with .preview.tsx stripped', () => {
    const components = createDiscovery({
      '/proj/src/components/button.preview.tsx': previewModule({ title: 'Button' }),
    })()

    expect(components[0].id).toBe('button')
  })

  it('retains the full module path', () => {
    const path = '/proj/src/components/button.preview.tsx'
    const components = createDiscovery({ [path]: previewModule({ title: 'Button' }) })()

    expect(components[0].path).toBe(path)
  })

  it('defaults category to Components when the preview omits it', () => {
    const components = createDiscovery({
      '/proj/button.preview.tsx': previewModule({ title: 'Button' }),
    })()

    expect(components[0].category).toBe('Components')
  })

  it('preserves an explicit category', () => {
    const components = createDiscovery({
      '/proj/button.preview.tsx': previewModule({ title: 'Button', category: 'Forms' }),
    })()

    expect(components[0].category).toBe('Forms')
  })

  it('falls back to the filename for name when title is empty', () => {
    const components = createDiscovery({
      '/proj/button.preview.tsx': previewModule({ title: '' }),
    })()

    expect(components[0].name).toBe('button')
    expect(components[0].title).toBe('')
  })

  it('sorts by category before name', () => {
    const components = createDiscovery({
      '/proj/a.preview.tsx': previewModule({ title: 'Alpha', category: 'Forms' }),
      '/proj/z.preview.tsx': previewModule({ title: 'Zulu', category: 'Buttons' }),
    })()

    expect(components.map((c) => c.name)).toEqual(['Zulu', 'Alpha'])
  })

  it('sorts by name within a category', () => {
    const components = createDiscovery({
      '/proj/c.preview.tsx': previewModule({ title: 'Charlie', category: 'Forms' }),
      '/proj/a.preview.tsx': previewModule({ title: 'Alpha', category: 'Forms' }),
      '/proj/b.preview.tsx': previewModule({ title: 'Bravo', category: 'Forms' }),
    })()

    expect(components.map((c) => c.name)).toEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('passes variants and demos through untouched', () => {
    const variants = [{ name: 'Primary', props: { variant: 'primary' } }]
    const components = createDiscovery({
      '/proj/button.preview.tsx': previewModule({ title: 'Button', variants }),
    })()

    expect(components[0].variants).toBe(variants)
    expect(components[0].demos).toBeUndefined()
  })

  // Documents current behavior: the id is produced by a plain string replace, so only
  // the first `.preview.tsx` occurrence is removed.
  it('strips only the first .preview.tsx occurrence from the filename', () => {
    const components = createDiscovery({
      '/proj/odd.preview.tsx.preview.tsx': previewModule({ title: 'Odd' }),
    })()

    expect(components[0].id).toBe('odd.preview.tsx')
  })
})
