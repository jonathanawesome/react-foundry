import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The package's own version, read from its manifest at startup.
 *
 * Read rather than written as a literal: a hardcoded one sat at `0.0.1` through nine
 * releases, so `foundry --version` could not pin a bug report to a build.
 *
 * The relative path holds in both layouts. In the monorepo this module runs as
 * `src/version.ts` under tsx; published, it is bundled into `dist/cli.js`, so
 * `import.meta.url` points at `dist/`. The manifest is the parent directory's either
 * way. npm always includes `package.json` in a tarball, so it is there to read.
 *
 * Falls back to `unknown` rather than throwing: reporting the version is never worth
 * failing a command over.
 */
export function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const manifest = readFileSync(resolve(here, '../package.json'), 'utf-8')

    return (JSON.parse(manifest) as { version?: string }).version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}
