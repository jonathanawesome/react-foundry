import type { NodeResult } from 'axe-core'

export type ScanMode = 'light' | 'dark'

/**
 * The rules that depend on rendered colors. Everything else axe checks is
 * theme-invariant, which is what makes a second pass cheap enough to run on demand.
 *
 * Do not add `color-contrast-enhanced`. It ships `enabled: false` so a default `axe.run`
 * never reports it, but `runOnly` bypasses the enabled flag, which would make the second
 * pass strictly broader than the first and mislabel every enhanced-contrast violation as
 * failing in only one mode.
 */
export const THEME_DEPENDENT_RULES = ['color-contrast', 'link-in-text-block']

/** The scan output shape, as read off `axe.run`'s `results.violations`. */
export interface Violation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  description: string
  help: string
  helpUrl: string
  nodes: NodeResult[]
}

/** `modes: null` means "never measured per-mode", so the UI renders it without a badge. */
export interface MergedNode extends NodeResult {
  modes: ScanMode[] | null
}

export interface MergedViolation extends Omit<Violation, 'nodes'> {
  nodes: MergedNode[]
}

/** Node identity: the React key for a row, and the join key across two passes. */
export function selectorOf(target: NodeResult['target']): string {
  return target.flat().join(' > ')
}

/**
 * Finds the live element a violation points at, or null.
 *
 * axe's selectors are document-rooted even when the run is scoped, so `document` is the
 * right place to look them up. The `root.contains` check then stops a selector left over
 * from before a re-render matching foundry's own chrome and highlighting the wrong thing.
 */
export function resolveTarget(
  target: NodeResult['target'],
  root: HTMLElement | null
): HTMLElement | null {
  // No `.at(-1)`: this package is lib ES2020 and `Array.prototype.at` is ES2022.
  const last = target[target.length - 1]
  // A nested array is an iframe/shadow path. Taking its last segment lets the containment
  // check below reject it, rather than resolving something in the wrong tree.
  const selector = Array.isArray(last) ? last[last.length - 1] : last
  if (!selector || !root) return null

  try {
    const el = document.querySelector(selector)
    return el instanceof HTMLElement && root.contains(el) ? el : null
  } catch {
    // axe can emit a selector the browser rejects.
    return null
  }
}

/** The result of a single-mode scan: nothing was measured per-mode, so nothing is tagged. */
export function withoutModes(violations: Violation[]): MergedViolation[] {
  return violations.map((violation) => ({
    ...violation,
    nodes: violation.nodes.map((node) => ({ ...node, modes: null })),
  }))
}

/**
 * Unions a full scan with a contrast-only scan of the opposite theme.
 *
 * Only theme-dependent rules get tagged, because the second pass did not run the others;
 * tagging those would claim a measurement that never happened.
 */
export function mergeByMode(
  base: Violation[],
  baseMode: ScanMode,
  second: Violation[],
  secondMode: ScanMode
): MergedViolation[] {
  // Fixed order, so a badge reads the same whichever theme the scan started in.
  const tag = (id: string, ...modes: ScanMode[]) =>
    THEME_DEPENDENT_RULES.includes(id)
      ? (['light', 'dark'] as const).filter((mode) => modes.includes(mode))
      : null

  const merged: MergedViolation[] = base.map((violation) => ({
    ...violation,
    nodes: violation.nodes.map((node) => ({
      ...node,
      modes: tag(violation.id, baseMode),
    })),
  }))
  const byRule = new Map(merged.map((violation) => [violation.id, violation]))

  for (const violation of second) {
    const existing = byRule.get(violation.id)

    // A rule that only fails in the second mode has no entry from the first pass.
    if (!existing) {
      const added: MergedViolation = {
        ...violation,
        nodes: violation.nodes.map((node) => ({
          ...node,
          modes: tag(violation.id, secondMode),
        })),
      }
      merged.push(added)
      byRule.set(added.id, added)
      continue
    }

    const byNode = new Map(existing.nodes.map((node) => [selectorOf(node.target), node]))

    for (const node of violation.nodes) {
      const match = byNode.get(selectorOf(node.target))
      if (match) {
        match.modes = tag(violation.id, baseMode, secondMode)
      } else {
        existing.nodes.push({ ...node, modes: tag(violation.id, secondMode) })
      }
    }
  }

  return merged
}

/** Identical consecutive frames that count as "the transition is over". */
const STEADY_FRAMES = 2

/** Sampling every descendant of a large preview is wasted work; the first few suffice. */
const SAMPLE_LIMIT = 25

/**
 * A fingerprint of everything axe reads that a theme change can still be animating.
 *
 * Colors are the obvious axis but not the only one. axe folds `opacity` into the effective
 * foreground and background, so a fading preview holds its colors steady while the ratio
 * is still wrong; and it hit-tests the element stack to find the background behind text,
 * so geometry in motion can resolve the wrong background entirely.
 *
 * Descendants are sampled, not just the root, because a preview pane's own background is
 * usually transparent and will not change between modes even when its content does.
 */
function settleSignature(root: HTMLElement): string {
  const sampled = [root, ...Array.from(root.querySelectorAll('*')).slice(0, SAMPLE_LIMIT)]

  return sampled
    .map((el) => {
      const { color, backgroundColor, borderColor, opacity } = getComputedStyle(el)
      const { x, y, width, height } = el.getBoundingClientRect()
      return `${color}|${backgroundColor}|${borderColor}|${opacity}|${x},${y},${width},${height}`
    })
    .join(';')
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/**
 * Waits for a theme change to land before anything measures it.
 *
 * A flip travels `setTheme` -> foundry's provider -> the `theme` prop -> the consumer's
 * provider -> their effect -> a class change -> style recalc, so a fixed frame count is a
 * guess. Instead: wait for the signature to change, then wait for it to stop changing.
 * That second half is what keeps axe off a half-finished transition, since an animated
 * preview moves the signature on its very first frame.
 *
 * Gives up at the budget and lets the caller scan anyway. A consumer that never wires the
 * `theme` prop through just produces two identical passes, which merge to "fails in both"
 * and show no badges, which is the honest answer for that setup.
 */
export async function waitForThemeToSettle(
  root: HTMLElement | null,
  budgetMs = 500
): Promise<void> {
  if (!root || typeof requestAnimationFrame === 'undefined') return

  const deadline = Date.now() + budgetMs
  const before = settleSignature(root)

  // Doubles as the "has it changed yet" flag: null until the flip first shows up.
  let previous: string | null = null
  let steady = 0

  while (Date.now() < deadline) {
    await nextFrame()
    const current = settleSignature(root)
    if (previous === null && current === before) continue

    steady = current === previous ? steady + 1 : 0
    previous = current
    if (steady >= STEADY_FRAMES) return
  }
}
