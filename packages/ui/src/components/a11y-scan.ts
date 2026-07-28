import type { NodeResult } from 'axe-core'

/** The scan output shape, as read off `axe.run`'s `results.violations`. */
export interface Violation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  description: string
  help: string
  helpUrl: string
  nodes: NodeResult[]
}

/** Node identity: the React key for a row, and a stable id for one violating element. */
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
