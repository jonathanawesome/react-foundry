import { createElement, type ElementType, type ReactNode } from 'react'

import {
  type ControllableProps,
  type ControlSchema,
  type ControlValues,
  type DeriveNarrowing,
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
 *
 * A `derive` on a select or radio here receives `string`, not the union of its
 * options; only {@link controlsFor} narrows it. See {@link DeriveNarrowing}.
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
 * A prop no input can express takes a scalar control with a `derive`, which maps
 * the control's value to the prop's type and is checked against it. The key must
 * still be a prop; only the input is freed, and only through that mapping:
 *
 * ```ts
 * const selectControls = controlsFor(Select, {
 *   options: { type: 'range', min: 1, max: 10, default: 4, derive: (n) => CLIENTS.slice(0, n) },
 *   icon: { type: 'select', options: ['globe', 'gauge'], default: 'globe', derive: (name) => ICONS[name] },
 * })
 * ```
 *
 * Prefer this whenever a preview exercises one component's API. Reach for
 * {@link defineControls} when a preview is deliberately mocking a page
 * composition and its controls drive JSX the preview assembles itself, which is a
 * legitimate thing to do and a different thing to be doing. `derive` does not
 * change that line: it produces one prop's value from one input, and cannot see
 * any other control.
 *
 * Take the schema inline. Hoisting it to a plain `const` first widens `type:
 * 'select'` to `string` before it ever arrives, and the resulting error names the
 * widening rather than the cause. Hoist the result instead:
 * `const cardControls = controlsFor(Card, { … })`.
 *
 * `O` and `G` are inferred, never written. See {@link DeriveNarrowing}.
 */
export function controlsFor<
  C extends ElementType,
  const S extends ControllableProps<C>,
  O,
  G,
>(component: C, controls: S & NoExtraControls<C, S> & DeriveNarrowing<O, G>): S {
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
 * `render` is mounted as a React component with the control values as its props,
 * not called as a function, so it can hold state and read context directly:
 *
 * ```tsx
 * export const Controlled = createPreview({
 *   controls: controlsFor(Select, { width: { type: 'radio', options: ['auto', 'full'] } }),
 *   render: (v) => {
 *     const [value, setValue] = useState('a')
 *     return <Select value={value} onValueChange={setValue} width={v.width} />
 *   },
 * })
 * ```
 *
 * That makes `render`'s identity what React keys its state on. It is stable when
 * written as a literal inside a module-level `createPreview` call, which is the
 * documented usage. Do not build previews inside a factory that runs during
 * render and recreates `render` each time: React would see a new component type
 * on every pass and remount it, losing the state inside.
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

  // A React component taking the control values as one private prop, so the host
  // can pass them without the wrapper's own props bag colliding with children/key/
  // ref. It mounts `render` as an element rather than calling it, which gives
  // `render` its own fiber: hooks inside it belong to it, and the control values
  // reach it as ordinary props. `render` is captured once here, so its identity is
  // stable across re-renders and React keeps that fiber's state.
  //
  // Wrap rather than tag `render` so we never mutate a caller-owned function. No
  // hook or context in the wrapper itself: tests call `preview()` directly, which
  // would throw if the wrapper read one.
  //
  // The values become `render`'s props verbatim, so a control named `key` is taken
  // by React and never reaches `render`. `controlsFor` cannot produce one, since
  // `key` and `ref` are stripped from the props it checks against.
  //
  // Named, and named with a capital, because React Fast Refresh decides what is a
  // component by `fn.name` for plain functions. An anonymous arrow assigned to
  // `const preview` reads as `'preview'` and fails that test, which cost every
  // `.preview.tsx` file its refresh boundary: an edit invalidated up to the routes
  // and full-reloaded the page instead of patching the canvas. The same predicate
  // also gates the runtime registration that covers previews written in the options
  // form, which the static transform does not detect on its own.
  const preview = function Preview(props) {
    return createElement(render, props?.controlValues)
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
