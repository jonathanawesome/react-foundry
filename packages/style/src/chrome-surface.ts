import { chromeSurface } from './global-styles.css'

/**
 * Props for a chrome surface root: the `chromeSurface` class plus the
 * `data-foundry-chrome` mark that global-styles.css.ts scopes foundry's resets to. They
 * are handed out together so a surface cannot take foundry's type while silently missing
 * its resets, and so marking one stays a single decision.
 *
 * Never spread this onto an ancestor of the canvas: see the INVARIANT in
 * global-styles.css.ts.
 *
 * ```tsx
 * <aside {...chromeSurfaceProps(shelfStyles.shelf)} data-open={isShelfOpen}>
 * ```
 */
// Lives outside global-styles.css.ts because a `.css.ts` module may only export
// serializable values, and this is a function.
export const chromeSurfaceProps = (...classNames: string[]) =>
  ({
    className: [chromeSurface, ...classNames].join(' '),
    'data-foundry-chrome': true,
  }) as const
