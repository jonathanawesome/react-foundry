import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Tooltip } from '../src/components/tooltip'

/**
 * jsdom lays nothing out: every rect and offset is zero, so placement would be
 * measured entirely from zeros and none of its arithmetic would be exercised.
 * These stub in a window, a control somewhere in it, and a bubble of a given
 * size, then read back where the component decided to put it.
 */
function stubLayout({
  windowSize = { width: 1000, height: 800 },
  anchor,
  bubble,
}: {
  windowSize?: { width: number; height: number }
  anchor: { left: number; top: number; width: number; height: number }
  bubble: { width: number; height: number }
}) {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(windowSize.width)
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(windowSize.height)

  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    ...anchor,
    right: anchor.left + anchor.width,
    bottom: anchor.top + anchor.height,
    x: anchor.left,
    y: anchor.top,
    toJSON: () => ({}),
  } as DOMRect)

  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(bubble.width)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(bubble.height)
}

/** The bubble's placement, as the inline styles the component wrote. */
function placementOf(label: string) {
  const bubble = screen.getByText(label).parentElement
  return { left: bubble?.style.left, top: bubble?.style.top }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Tooltip', () => {
  it('stays closed until the control is hovered or focused', () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )

    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  it('opens on hover and closes again on leave', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )
    const trigger = screen.getByRole('button', { name: 'theme' })

    await userEvent.hover(trigger)
    expect(screen.getByText('Toggle Theme')).toBeInTheDocument()

    await userEvent.unhover(trigger)
    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  // Keyboard users get the same hint mouse users do.
  it('opens when the control takes focus and closes when it loses it', async () => {
    render(
      <>
        <Tooltip label="Toggle Theme" shortcut="t">
          <button type="button">theme</button>
        </Tooltip>
        <button type="button">elsewhere</button>
      </>
    )

    await userEvent.tab()
    expect(screen.getByText('Toggle Theme')).toBeInTheDocument()

    await userEvent.tab()
    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  it('renders the shortcut as a key cap', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'theme' }))
    expect(screen.getByText('t').tagName).toBe('KBD')
  })

  it('omits the key cap when there is no shortcut', async () => {
    render(
      <Tooltip label="Toggle Theme">
        <button type="button">theme</button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'theme' }))
    expect(
      screen.getByText('Toggle Theme').parentElement?.querySelector('kbd')
    ).toBeNull()
  })

  // The wrapped control already carries the same words as its accessible name,
  // so announcing the bubble too would say everything twice.
  it('hides the bubble from assistive tech', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button" aria-label="Toggle Theme">
          theme
        </button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(screen.getByText('Toggle Theme').parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  describe('placement', () => {
    const open = async () => {
      render(
        <Tooltip label="Toggle Controls Panel" shortcut="p">
          <button type="button">panel</button>
        </Tooltip>
      )
      await userEvent.hover(screen.getByRole('button', { name: 'panel' }))
    }

    it('centers the bubble under a control with room on both sides', async () => {
      // A 24px control centered at x=512, a 200px bubble: 512 - 100 = 412.
      stubLayout({
        anchor: { left: 500, top: 100, width: 24, height: 24 },
        bubble: { width: 200, height: 28 },
      })
      await open()

      expect(placementOf('Toggle Controls Panel')).toEqual({
        left: '-88px',
        top: '32px',
      })
    })

    // The bug this was written for: the toolbar sits 12px from the left of the
    // window, so a centered bubble ran its label off the edge.
    it('pulls the bubble back inside the left edge', async () => {
      stubLayout({
        anchor: { left: 20, top: 12, width: 24, height: 24 },
        bubble: { width: 200, height: 28 },
      })
      await open()

      // Clamped to the 8px margin, which is 12px left of the anchor.
      expect(placementOf('Toggle Controls Panel').left).toBe('-12px')
    })

    // The same thing on the other side, for a toolbar that has moved.
    it('pulls the bubble back inside the right edge', async () => {
      stubLayout({
        windowSize: { width: 1000, height: 800 },
        anchor: { left: 950, top: 12, width: 24, height: 24 },
        bubble: { width: 200, height: 28 },
      })
      await open()

      // Rightmost is 1000 - 8 - 200 = 792, which is 158px left of the anchor.
      expect(placementOf('Toggle Controls Panel').left).toBe('-158px')
    })

    it('flips the bubble above a control with no room below', async () => {
      stubLayout({
        windowSize: { width: 1000, height: 800 },
        anchor: { left: 500, top: 760, width: 24, height: 24 },
        bubble: { width: 200, height: 28 },
      })
      await open()

      // 784 + 8 + 28 runs past 792, so it goes above: -(28 + 8).
      expect(placementOf('Toggle Controls Panel').top).toBe('-36px')
    })

    it('keeps a bubble wider than the window pinned to the left edge', async () => {
      stubLayout({
        windowSize: { width: 180, height: 800 },
        anchor: { left: 20, top: 12, width: 24, height: 24 },
        bubble: { width: 400, height: 28 },
      })
      await open()

      expect(placementOf('Toggle Controls Panel').left).toBe('-12px')
    })

    it('re-places the bubble when the window resizes under it', async () => {
      stubLayout({
        anchor: { left: 500, top: 100, width: 24, height: 24 },
        bubble: { width: 200, height: 28 },
      })
      await open()
      expect(placementOf('Toggle Controls Panel').left).toBe('-88px')

      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(600)
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      // Rightmost is now 600 - 8 - 200 = 392, which is 108px left of the anchor.
      expect(placementOf('Toggle Controls Panel').left).toBe('-108px')
    })
  })
})
