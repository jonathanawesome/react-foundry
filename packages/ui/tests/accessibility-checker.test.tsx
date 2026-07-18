import { render, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import {
  AccessibilityChecker,
  getImpactColor,
} from '../src/components/accessibility-checker'
import { accessibilityCheckerStyles } from '../src/components/accessibility-checker.css'

describe('getImpactColor', () => {
  it('maps each axe impact level to its own style', () => {
    expect(getImpactColor('critical')).toBe(accessibilityCheckerStyles.impactCritical)
    expect(getImpactColor('serious')).toBe(accessibilityCheckerStyles.impactSerious)
    expect(getImpactColor('moderate')).toBe(accessibilityCheckerStyles.impactModerate)
    expect(getImpactColor('minor')).toBe(accessibilityCheckerStyles.impactMinor)
  })

  it('returns an empty string for a missing or unrecognized impact', () => {
    expect(getImpactColor(null)).toBe('')
    expect(getImpactColor('catastrophic')).toBe('')
  })
})

describe('AccessibilityChecker', () => {
  it('renders nothing while disabled', () => {
    const { container } = render(
      <AccessibilityChecker targetRef={createRef<HTMLDivElement>()} isEnabled={false} />
    )

    expect(container).toBeEmptyDOMElement()
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
