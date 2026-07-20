/**
 * True when foundry is running from raw workspace source (the in-monorepo demo) rather
 * than the compiled, published package. The two need different Vite wiring: source mode
 * compiles the `.css.ts` and routes with plugins and resolves ui/style to workspace
 * source; published mode aliases them to the precompiled client bundle and drops those
 * plugins.
 *
 * Auto-detected from whether this module runs as raw `.ts` (via tsx, in the monorepo) or
 * bundled `.js` (in `dist/`), so nothing needs configuring. `FOUNDRY_DEV_SOURCE=1|0` is
 * an escape hatch, used only by tests to force a mode.
 */
export function isDevSource(): boolean {
  const override = process.env.FOUNDRY_DEV_SOURCE
  if (override === '1') return true
  if (override === '0') return false
  return import.meta.url.endsWith('.ts')
}
