import { render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { AccessibilityChecker, impactTone } from '../src/components/accessibility-checker'
import { accessibilityCheckerStyles } from '../src/components/accessibility-checker.css'

describe('impactTone', () => {
  it('maps each axe impact level to a badge tone', () => {
    expect(impactTone('critical')).toBe('danger')
    expect(impactTone('serious')).toBe('warning')
    expect(impactTone('moderate')).toBe('caution')
    expect(impactTone('minor')).toBe('info')
  })

  it('falls back to neutral for a missing or unrecognized impact', () => {
    expect(impactTone(null)).toBe('neutral')
    expect(impactTone('catastrophic')).toBe('neutral')
  })
})

describe('AccessibilityChecker', () => {
  // Stays mounted so it can slide out, but marks itself closed and hidden.
  it('is present but closed while disabled', () => {
    const { container } = render(
      <AccessibilityChecker targetRef={createRef<HTMLDivElement>()} isEnabled={false} />
    )
    const bar = container.firstElementChild

    expect(bar).toHaveAttribute('data-open', 'false')
    expect(bar).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks itself open while enabled', () => {
    const { container } = render(
      <AccessibilityChecker targetRef={createRef<HTMLDivElement>()} isEnabled />
    )

    expect(container.firstElementChild).toHaveAttribute('data-open', 'true')
  })

  // The bar spans the canvas: inset from the left by the shelf and from the
  // right by the panel, only while each is open.
  describe('bar width', () => {
    const s = accessibilityCheckerStyles

    function bar(isShelfOpen: boolean, isPanelOpen: boolean) {
      const { container } = render(
        <AccessibilityChecker
          targetRef={createRef<HTMLDivElement>()}
          isEnabled
          isShelfOpen={isShelfOpen}
          isPanelOpen={isPanelOpen}
        />
      )
      return container.firstElementChild as HTMLElement
    }

    it('insets both edges when the shelf and panel are open', () => {
      const el = bar(true, true)
      expect(el).toHaveClass(s.containerWithShelf)
      expect(el).toHaveClass(s.containerWithPanel)
    })

    it('insets only the right when the shelf is closed', () => {
      const el = bar(false, true)
      expect(el).not.toHaveClass(s.containerWithShelf)
      expect(el).toHaveClass(s.containerWithPanel)
    })

    it('insets only the left when the panel is closed', () => {
      const el = bar(true, false)
      expect(el).toHaveClass(s.containerWithShelf)
      expect(el).not.toHaveClass(s.containerWithPanel)
    })

    it('spans full width when both are closed', () => {
      const el = bar(false, false)
      expect(el).not.toHaveClass(s.containerWithShelf)
      expect(el).not.toHaveClass(s.containerWithPanel)
    })
  })

  // Slow by design: drives a real axe-core scan against real bad DOM, on top of the
  // component's own 500ms debounce. `image-alt` is one of axe's most stable rules and
  // needs no layout, so it survives jsdom. If this ever goes flaky in CI, delete it
  // rather than adding retries; the tests above carry the real value.
  it(
    'surfaces a violation that axe finds in the target',
    { timeout: 10000 },
    async () => {
      function Harness() {
        const ref = createRef<HTMLDivElement>()
        return (
          <>
            <div ref={ref}>
              {/* biome-ignore lint/a11y/useAltText: the missing alt is what axe must catch */}
              <img src="broken.png" />
            </div>
            <AccessibilityChecker targetRef={ref} isEnabled={true} />
          </>
        )
      }

      render(<Harness />)

      await waitFor(
        () => {
          expect(screen.getByText(/1 issue/)).toBeInTheDocument()
        },
        { timeout: 8000 }
      )

      // Anchored on the rule id in the help URL rather than axe's prose, which changes
      // between versions.
      expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
        'href',
        expect.stringContaining('image-alt')
      )
    }
  )
})
