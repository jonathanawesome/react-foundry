import { render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { AccessibilityChecker, impactTone } from '../src/components/accessibility-checker'

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
  // Stays mounted so it can animate closed, but marks itself closed and hidden.
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
