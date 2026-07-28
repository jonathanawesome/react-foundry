import { createPreview } from '@react-foundry/core'
import { ThemeContext } from '@react-foundry/style'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccessibilityChecker } from '../src/components/accessibility-checker'
import { Preview } from '../src/components/preview'
import { useUIStore } from '../src/state'
import { renderWithRouter } from './test-utils'

// Everything here needs controlled violations, so axe is mocked. That is why it lives
// apart from accessibility-checker.test.tsx, whose slowest test needs the real axe.
const run = vi.fn()
vi.mock('axe-core', () => ({ default: { run: () => run() } }))

function node(target: string[]) {
  return { html: '<img />', target, any: [], all: [], none: [], failureSummary: 'why' }
}

const LOCATE = 'Highlight in the preview'
const CLEAR = 'Clear highlight'

const preview = createPreview(() => (
  <div>
    {/* biome-ignore lint/a11y/useAltText: the violations here are fabricated anyway */}
    <img className="first" src="a.png" />
    {/* biome-ignore lint/a11y/useAltText: the violations here are fabricated anyway */}
    <img className="second" src="b.png" />
  </div>
))

/** Renders the canvas with the checker on, and waits out its 500ms scan debounce. */
async function renderScanned() {
  const result = await renderWithRouter(<Preview preview={preview} />)
  await waitFor(() => expect(screen.getAllByTitle(LOCATE)).toHaveLength(2), {
    timeout: 3000,
  })
  return result
}

const overlay = () => document.querySelector('[data-foundry-highlight]')

describe('locate button', () => {
  beforeEach(() => {
    useUIStore.setState({ isAccessibilityEnabled: true, isShelfOpen: false })
    run.mockResolvedValue({
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
          nodes: [node(['.first']), node(['.second']), node(['.gone'])],
        },
      ],
    })
  })

  // Three violating nodes, but only two of them exist in the canvas. A button that
  // outlines nothing is worse than no button.
  it('renders one per resolvable node and none for the rest', async () => {
    await renderScanned()

    expect(screen.getAllByTitle(LOCATE)).toHaveLength(2)
  })

  it('pins on click and unpins on a second click', async () => {
    await renderScanned()
    const [first] = screen.getAllByTitle(LOCATE)

    await userEvent.click(first)
    expect(screen.getByTitle(CLEAR)).toHaveAttribute('aria-pressed', 'true')
    expect(overlay()).toHaveAttribute('data-pinned', 'true')

    const pinned = screen.getByTitle(CLEAR)
    await userEvent.click(pinned)
    expect(screen.queryByTitle(CLEAR)).not.toBeInTheDocument()

    // The pointer never left the button, so unpinning drops back to a hover preview
    // rather than clearing the overlay outright.
    expect(overlay()).toHaveAttribute('data-pinned', 'false')
    await userEvent.unhover(pinned)
    expect(overlay()).not.toBeInTheDocument()
  })

  it('moves the pin when a second node is clicked', async () => {
    await renderScanned()

    await userEvent.click(screen.getAllByTitle(LOCATE)[0])
    await userEvent.click(screen.getByTitle(LOCATE))

    // Exactly one pinned button, and it is no longer the first.
    const pinned = screen.getByTitle(CLEAR)
    expect(pinned).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByTitle(LOCATE)).toHaveLength(1)
    expect(pinned).not.toBe(screen.getAllByTitle(LOCATE)[0])
  })

  // Hover is a preview of the pin, so it draws a fainter overlay and leaves no pressed
  // state behind once the pointer moves away.
  it('previews on hover without pinning', async () => {
    await renderScanned()
    const [first] = screen.getAllByTitle(LOCATE)

    await userEvent.hover(first)
    expect(overlay()).toHaveAttribute('data-pinned', 'false')
    expect(first).toHaveAttribute('aria-pressed', 'false')

    await userEvent.unhover(first)
    expect(overlay()).not.toBeInTheDocument()
  })

  it('drops the pin on a rescan, which invalidates every resolved element', async () => {
    await renderScanned()

    await userEvent.click(screen.getAllByTitle(LOCATE)[0])
    expect(overlay()).toBeInTheDocument()

    await userEvent.click(screen.getByTitle('Re-run accessibility check'))

    await waitFor(() => expect(overlay()).not.toBeInTheDocument())
  })
})

/**
 * Drives the checker directly, so `scanKey` and the theme can be changed without a
 * navigation or a real ThemeProvider.
 */
function Checker({
  scanKey = 'a',
  theme = 'light',
}: {
  scanKey?: string
  theme?: 'light' | 'dark'
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme: () => {} }}>
      <div ref={ref}>
        {/* biome-ignore lint/a11y/useAltText: the violation is fabricated by the mock */}
        <img className="first" src="a.png" />
      </div>
      {/* onPin is wired but inert: locate buttons only render when a handler exists, and
          these tests assert on their presence rather than on the highlight itself. */}
      <AccessibilityChecker
        targetRef={ref}
        isEnabled
        scanKey={scanKey}
        onPin={() => {}}
      />
    </ThemeContext.Provider>
  )
}

const collapse = () => userEvent.click(screen.getByRole('button', { expanded: true }))
const expand = () => userEvent.click(screen.getByRole('button', { expanded: false }))

// axe's third bucket. Contrast lands here whenever the element is off screen, which on a
// tall preview is most of it, so dropping it would let a thin report look like a clean one.
describe('incomplete results', () => {
  const rule = (id: string, selector: string) => ({
    id,
    impact: 'serious',
    description: `${id} description`,
    help: `${id} help`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.11/${id}`,
    nodes: [node([selector])],
  })

  beforeEach(() => {
    run.mockClear()
  })

  it('lists them under their own heading, with locate buttons', async () => {
    run.mockResolvedValue({
      violations: [],
      incomplete: [rule('color-contrast', '.first')],
    })
    render(<Checker />)

    expect(
      await screen.findByText('Could not be checked', {}, { timeout: 3000 })
    ).toBeInTheDocument()
    expect(screen.getByTitle(LOCATE)).toBeInTheDocument()
  })

  // "Passed" beside results axe never reached a verdict on would overstate the scan.
  it('withholds the pass mark and counts them in the header', async () => {
    run.mockResolvedValue({
      violations: [],
      incomplete: [rule('color-contrast', '.first')],
    })
    render(<Checker />)

    expect(
      await screen.findByText(/1 unchecked/, {}, { timeout: 3000 })
    ).toBeInTheDocument()
    expect(screen.queryByText('Passed')).not.toBeInTheDocument()
  })

  it('still passes when both buckets are empty', async () => {
    run.mockResolvedValue({ violations: [], incomplete: [] })
    render(<Checker />)

    expect(await screen.findByText('Passed', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})

describe('scan triggers', () => {
  beforeEach(() => {
    run.mockClear()
    run.mockResolvedValue({
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/image-alt',
          nodes: [node(['.first'])],
        },
      ],
    })
  })

  const scanned = (times: number) =>
    waitFor(() => expect(run).toHaveBeenCalledTimes(times), { timeout: 3000 })

  it('rescans when the canvas changes', async () => {
    const { rerender } = render(<Checker scanKey="a" />)
    await scanned(1)

    rerender(<Checker scanKey="b" />)

    await scanned(2)
  })

  // Contrast is measured from rendered colors, so the previous results are stale the
  // moment the mode flips, however the flip was triggered.
  it('rescans when the resolved theme changes', async () => {
    const { rerender } = render(<Checker theme="light" />)
    await scanned(1)

    rerender(<Checker theme="dark" />)

    await scanned(2)
  })

  // Proving a negative, so the debounce has to be given time to fire and not.
  it('does not scan while collapsed', async () => {
    const { rerender } = render(<Checker scanKey="a" />)
    await scanned(1)

    await collapse()
    rerender(<Checker scanKey="b" />)
    await new Promise((resolve) => setTimeout(resolve, 900))

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('catches up on the scan it skipped when expanded again', async () => {
    render(<Checker scanKey="a" />)
    await scanned(1)

    await collapse()
    await expand()

    await scanned(2)
  })

  // Collapsing hides the detail, but the header count still describes the canvas on
  // screen, so blanking it would read as "no issues" rather than "not shown".
  it('keeps the last count in the header while collapsed', async () => {
    render(<Checker scanKey="a" />)
    await screen.findByText(/1 issue/, {}, { timeout: 3000 })

    await collapse()

    expect(screen.getByText(/1 issue/)).toBeInTheDocument()
  })
})
