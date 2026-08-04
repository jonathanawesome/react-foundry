import { execSync } from 'node:child_process'
import { cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: pkgRoot })

const dist = resolve(pkgRoot, 'dist')
await rm(dist, { recursive: true, force: true })

// 1. Client bundle: style + ui + core compiled through the vanilla-extract plugin into
//    dist/client (one JS per entry + client.css with the inlined font).
run('vite build -c vite.client.config.ts')

// 2. The app tree ships as raw tsx/ts (it's the consumer's Vite input). Copied verbatim:
//    the route tree is hand-written, so nothing is generated here or at runtime.
await cp(resolve(pkgRoot, 'src/app'), resolve(dist, 'app'), { recursive: true })

// 3. Node side: the side-effect-free public index (+ types) and the CLI, bundled.
run('tsdown')

console.log('\nreact-foundry build complete.')
