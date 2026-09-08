/**
 * Scopes foundry's element resets (global-styles.css.ts) to its own chrome: a selector
 * list matching every marked chrome surface (`data-foundry-chrome`) and its subtree, and
 * nothing else in the document.
 *
 * Scoped to the chrome rather than excluded from the canvas: portalled previews (Base UI,
 * Radix and Floating UI all default to `document.body`) land outside the canvas, and the
 * old `:not(:where([data-foundry-canvas] …))` stripped their margin and padding. Foundry
 * cannot name every container a preview portals into, but it can name its own chrome.
 *
 * Each reset is emitted for the marked surface and for its subtree. `:where(...)` is zero
 * specificity, so both forms weigh what the bare selector weighs and keep sitting beneath
 * the component styles (e.g. `all: unset` must not beat a shelf button's `display: flex`).
 *
 * INVARIANT: never mark an ancestor of the canvas, or the subtree half sweeps the
 * consumer's component back in. Those elements declare what they need in their own styles.
 */
// A plain module rather than part of global-styles.css.ts, which may only export
// serializable values, so this is where the scoping can be unit tested.
export const CHROME_SCOPE = ':where([data-foundry-chrome])'

export const chromeOnly = (selectors: string) =>
  selectors
    .split(',')
    .flatMap((s) => {
      const sel = s.trim()
      // Nothing may follow a pseudo-element, so the scope splices in ahead of one:
      // `*:where(…)::before`, never the invalid `*::before:where(…)`, which would drop
      // the whole rule.
      const [element, ...pseudoElement] = sel.split('::')
      const tail = pseudoElement.map((part) => `::${part}`).join('')

      return [`${element}${CHROME_SCOPE}${tail}`, `${CHROME_SCOPE} ${sel}`]
    })
    .join(', ')
