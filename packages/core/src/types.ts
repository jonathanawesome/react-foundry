import type { ComponentType, ReactElement } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: component refs need flexible typing
type AnyComponent = ComponentType<any>

/**
 * Augmented by the generated `foundry-nav.gen.d.ts` in the user's project to
 * carry the set of nav paths declared in their config. Empty here on purpose:
 * consumers with no config fall back to plain `string`.
 *
 * Same declaration-merging pattern TanStack Router uses for its route tree.
 */
// biome-ignore lint/suspicious/noEmptyInterface: intentionally empty, users augment it
export interface Register {}

/**
 * Pulls the declared nav paths out of a {@link Register}, falling back to
 * `string` when it carries none.
 *
 * Split out from {@link NavPath} so it can be exercised with both an augmented
 * and an unaugmented register. Declaration merging is global to a compilation,
 * so a test file cannot augment `Register` without affecting every other
 * assertion in the same run.
 */
export type ResolveNavPath<R> = R extends { navPath: infer P extends string } ? P : string

/**
 * A slash-delimited position in the nav tree, e.g. `'Forms/Button'`.
 *
 * Resolves to a union of the paths declared in `foundry.config.ts` once the
 * generated types are present, giving autocomplete and typo errors. Degrades
 * to `string` when there is no config, so previews still typecheck without one.
 */
export type NavPath = ResolveNavPath<Register>

/**
 * Brand marking a function as a preview. Discovery filters on this rather than
 * guessing from shape, so helpers and fixtures exported from a `.preview.tsx`
 * file never leak into the nav tree.
 */
export const PREVIEW: unique symbol = Symbol.for('react-foundry.preview')

export type RenderFn = () => ReactElement

export interface PreviewOptions {
  /** Overrides the label derived from the export name. */
  label?: string
  render: RenderFn
}

export type Preview = RenderFn & {
  [PREVIEW]: true
  label?: string
}

/** One navigable preview: a leaf of the nav tree. */
export interface PreviewLeaf {
  /** Url path, built from the nav path and the export name. */
  id: string
  label: string
  /** The export name this leaf came from. Drives `id`, never the label. */
  exportName: string
  component: Preview
}

/**
 * One group as declared in the user's config. Declaration order is display
 * order, so this is how authors control where a section sits in the shelf.
 */
export interface NavItem {
  label: string
  children?: NavItem[]
}

/** A group in the nav tree. Nests to arbitrary depth. */
export interface NavNode {
  label: string
  /** Slash-delimited path from the root, e.g. `'Forms/Button'`. */
  path: string
  children: NavNode[]
  leaves: PreviewLeaf[]
}

export interface ComponentVariant {
  name: string
  props: Record<string, unknown>
}

export interface ComponentDemo {
  name: string
  render: () => ReactElement
}

export interface ComponentPreview {
  title: string
  component: AnyComponent
  variants?: ComponentVariant[]
  demos?: ComponentDemo[]
  category?: string
}

export interface PreviewModule {
  default: ComponentPreview
}

/**
 * One discovered `.preview.tsx` file, as emitted by the previews virtual module.
 *
 * `exportOrder` is read off the source at build time because it cannot be
 * recovered at runtime: the ES spec sorts module namespace keys alphabetically,
 * so `Object.keys(module)` loses the order the author wrote.
 */
export interface PreviewFile {
  module: Record<string, unknown>
  exportOrder: string[]
}

export interface DiscoveredComponent {
  id: string
  path: string
  title: string
  component: AnyComponent
  category: string
  variants?: ComponentVariant[]
  demos?: ComponentDemo[]
  name: string
}
