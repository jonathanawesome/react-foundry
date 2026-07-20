#!/usr/bin/env node
// One bin that works both in the monorepo and when installed. The tell is whether the
// raw TypeScript source is present: it ships only in the monorepo (the published tarball
// carries `dist/`, not `src/`). In the monorepo we run the source through tsx for fast,
// build-free iteration in source mode; when installed we run the compiled CLI.
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '../src/cli.ts')

if (existsSync(source)) {
  await import('tsx/esm')
  await import(source)
} else {
  await import(resolve(here, '../dist/cli.js'))
}
