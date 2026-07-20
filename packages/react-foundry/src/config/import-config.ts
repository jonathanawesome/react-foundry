import { mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

/**
 * Loads a user's `foundry.config.{ts,js,mjs}`.
 *
 * esbuild bundles it to a single ESM file in the cache dir, which is then imported. This
 * replaces relying on `tsx` (gone from the published package) and works for TS and
 * multi-file configs alike. `packages: 'external'` leaves `react-foundry` and other
 * installed deps as bare imports, resolved from the user's `node_modules`. The mtime in
 * the filename busts the ESM module cache so edits are picked up on reload.
 */
export async function importUserConfig(
  configPath: string,
  cacheDir: string
): Promise<Record<string, unknown>> {
  mkdirSync(cacheDir, { recursive: true })

  const stamp = statSync(configPath).mtimeMs
  const outfile = resolve(cacheDir, `foundry.config.${stamp}.mjs`)

  await build({
    entryPoints: [configPath],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    logLevel: 'silent',
  })

  const mod = await import(pathToFileURL(outfile).href)
  return (mod.default ?? {}) as Record<string, unknown>
}
