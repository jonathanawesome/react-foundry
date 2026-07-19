import type { ReactNode } from 'react'

import {
  type ControlSchema,
  type ControlValues,
  PREVIEW,
  type Preview,
  type RenderFn,
} from './types'

/**
 * Identity helper that preserves a controls schema's literal types.
 *
 * Assigning a schema to a plain `const` widens `type: 'select'` to `string` and
 * collapses the discriminated union. Passing it through here (the `const` type
 * parameter) keeps the literals, so an extracted schema reused across previews
 * still types each `render`'s values — and select values still narrow to their
 * options.
 *
 * ```ts
 * const buttonControls = defineControls({
 *   variant: { type: 'select', options: ['primary', 'danger'] },
 * })
 * type ButtonValues = ControlValues<typeof buttonControls>
 * ```
 */
export function defineControls<const S extends ControlSchema>(controls: S): S {
  return controls
}

/**
 * Marks a render function as a preview so discovery will pick it up as a leaf
 * of the nav tree.
 *
 * Takes either a bare render function, or an options object when you need a
 * label the export name can't express:
 *
 * ```tsx
 * export const Primary = createPreview(() => <Button variant="primary" />)
 *
 * export const Playground = createPreview({
 *   controls: { variant: { type: 'select', options: ['primary', 'danger'] } },
 *   render: (v) => <Button variant={v.variant} />,
 * })
 * ```
 *
 * Exports that are not wrapped are ignored, so a `.preview.tsx` file can also
 * export helpers and fixtures without them showing up in the nav.
 */
export function createPreview(render: RenderFn): Preview
// The `const` schema parameter keeps literal option types, so `render`'s values
// are typed from the schema — `v.variant` is the union of its options, and a
// typo is a compile error.
export function createPreview<const S extends ControlSchema>(options: {
  label?: string
  controls?: S
  render: (values: ControlValues<S>) => ReactNode
}): Preview
// Implementation signature (not public): `render`'s param is widened so both
// overloads are assignable to it.
export function createPreview(
  input:
    | RenderFn
    // biome-ignore lint/suspicious/noExplicitAny: widened to cover both overloads
    | { label?: string; controls?: ControlSchema; render: (values: any) => ReactNode }
): Preview {
  const isBare = typeof input === 'function'
  const render = isBare ? input : input.render

  // A React component taking the control values as one private prop, so control
  // names can't collide with children/key/ref. Wrap rather than tag `render`
  // so we never mutate a caller-owned function; module-scope identity stays
  // stable for React. No hook or context here: tests call `preview()` directly,
  // which would throw if the wrapper read one.
  const preview = ((props) => render(props?.controlValues)) as Preview

  preview[PREVIEW] = true
  preview.label = isBare ? undefined : input.label
  preview.controls = isBare ? undefined : input.controls

  return preview
}

/** True for values produced by {@link createPreview}. */
export function isPreview(value: unknown): value is Preview {
  return typeof value === 'function' && (value as Preview)[PREVIEW] === true
}
