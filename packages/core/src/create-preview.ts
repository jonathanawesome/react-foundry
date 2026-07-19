import { PREVIEW, type Preview, type PreviewOptions, type RenderFn } from './types'

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
export function createPreview(input: RenderFn | PreviewOptions): Preview {
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
