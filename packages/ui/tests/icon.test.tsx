import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon, type IconName } from '../src/components/icon/icon'
import { IconMap } from '../src/components/icon/icon-map'

function svgOf(container: HTMLElement) {
  return container.querySelector('svg')
}

function wrapperOf(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

describe('Icon', () => {
  it('renders an svg for a known name', () => {
    const { container } = render(<Icon name="Notebook" />)

    expect(svgOf(container)).toBeInTheDocument()
  })

  it('renders every name in the map', () => {
    for (const name of Object.keys(IconMap) as IconName[]) {
      const { container } = render(<Icon name={name} />)
      expect(svgOf(container)).toBeInTheDocument()
    }
  })

  // Classes are hashed and jsdom computes no styles, so the observable effect of
  // a variant is a different wrapper class, not a different rule.
  it('applies a different class per rotation', () => {
    const { container: none } = render(<Icon name="CaretRight" />)
    const { container: turned } = render(<Icon name="CaretRight" rotate="90" />)

    expect(wrapperOf(none).className).not.toBe(wrapperOf(turned).className)
  })

  it('applies a different class per size', () => {
    const { container: sm } = render(<Icon name="CaretRight" size="sm" />)
    const { container: md } = render(<Icon name="CaretRight" size="md" />)

    expect(wrapperOf(sm).className).not.toBe(wrapperOf(md).className)
  })

  it('defaults to the md size', () => {
    const { container: bare } = render(<Icon name="CaretRight" />)
    const { container: md } = render(<Icon name="CaretRight" size="md" />)

    expect(wrapperOf(bare).className).toBe(wrapperOf(md).className)
  })
})
