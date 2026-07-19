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
 * export const AllSizes = createPreview({
 *   label: 'Every Size',
 *   render: () => <Stack>...</Stack>,
 * })
 * ```
 *
 * Exports that are not wrapped are ignored, so a `.preview.tsx` file can also
 * export helpers and fixtures without them showing up in the nav.
 */
export function createPreview(input: RenderFn | PreviewOptions): Preview {
  const isBare = typeof input === 'function'
  const render = isBare ? input : input.render

  // Wrap rather than tag `render` directly so we never mutate a caller-owned
  // function. Called at module scope, so the identity stays stable for React.
  const preview = (() => render()) as Preview

  preview[PREVIEW] = true
  preview.label = isBare ? undefined : input.label

  return preview
}

/** True for values produced by {@link createPreview}. */
export function isPreview(value: unknown): value is Preview {
  return typeof value === 'function' && (value as Preview)[PREVIEW] === true
}
