import type { ElementType, ReactNode } from 'react'

import {
  type ControllableProps,
  type ControlSchema,
  type ControlValues,
  type NoExtraControls,
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
 * {@link defineControls}, bound to a component, so the schema is checked against
 * that component's props.
 *
 * A control naming no prop is a compile error, a control whose input doesn't suit
 * the prop's type is a compile error, and `options` is constrained to the prop's
 * own union, so a typo in a variant name fails to compile rather than quietly
 * rendering a broken variant:
 *
 * ```ts
 * const cardControls = controlsFor(Card, {
 *   title: { type: 'text', default: 'Alert rule' },
 *   variant: { type: 'radio', options: ['default', 'selectable'], default: 'default' },
 * })
 * ```
 *
 * Props no control can drive are absent from the schema entirely, so a component
 * that cannot meaningfully have a props playground says so at the first control
 * you write.
 *
 * Prefer this whenever a preview exercises one component's API. Reach for
 * {@link defineControls} when a preview is deliberately mocking a page
 * composition and its controls drive JSX the preview assembles itself, which is a
 * legitimate thing to do and a different thing to be doing.
 *
 * Take the schema inline. Hoisting it to a plain `const` first widens `type:
 * 'select'` to `string` before it ever arrives, and the resulting error names the
 * widening rather than the cause. Hoist the result instead:
 * `const cardControls = controlsFor(Card, { … })`.
 */
export function controlsFor<C extends ElementType, const S extends ControllableProps<C>>(
  component: C,
  controls: S & NoExtraControls<C, S>
): S {
  // Unused at runtime and load-bearing for inference: `C` comes from here, and it
  // is what every check on `controls` is made against. `noUnusedParameters` flags
  // it otherwise, and `_component` would read badly in hover.
  void component

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
  //
  // Named, and named with a capital, because React Fast Refresh decides what is a
  // component by `fn.name` for plain functions. An anonymous arrow assigned to
  // `const preview` reads as `'preview'` and fails that test, which cost every
  // `.preview.tsx` file its refresh boundary: an edit invalidated up to the routes
  // and full-reloaded the page instead of patching the canvas. The same predicate
  // also gates the runtime registration that covers previews written in the options
  // form, which the static transform does not detect on its own.
  const preview = function Preview(props) {
    return render(props?.controlValues)
  } as Preview

  preview[PREVIEW] = true
  preview.label = isBare ? undefined : input.label
  preview.controls = isBare ? undefined : input.controls

  return preview
}

/** True for values produced by {@link createPreview}. */
export function isPreview(value: unknown): value is Preview {
  return typeof value === 'function' && (value as Preview)[PREVIEW] === true
}
