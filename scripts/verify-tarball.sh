#!/usr/bin/env bash
#
# Verifies the published `react-foundry` package by installing the packed tarball into a
# throwaway project OUTSIDE the monorepo (a flat npm layout, the opposite of the strict
# pnpm workspace) and driving `foundry dev | build | preview`. Every assertion maps to a
# packaging landmine: the .css.ts-in-node_modules failure, the monorepo path assumptions,
# fs.strict, the routeTree/cacheDir writes, and the cli.parse split.
#
# Usage: bash scripts/verify-tarball.sh
# Requires: node, npm, pnpm. Exits non-zero on the first failure.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/rf-verify.XXXXXX")"
DEV_LOG="$WORK/dev.log"
PREVIEW_LOG="$WORK/preview.log"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "  ok: $*"; }

# --- 1. Build + pack -----------------------------------------------------------
echo "==> building and packing react-foundry"
pnpm --filter react-foundry build >/dev/null
TARBALL="$(cd "$REPO_ROOT/packages/react-foundry" && pnpm pack --pack-destination "$WORK" 2>/dev/null | tail -1)"
[ -f "$TARBALL" ] || fail "pack did not produce a tarball ($TARBALL)"
pass "packed $(basename "$TARBALL")"

# --- 2. Scaffold a consumer OUTSIDE the monorepo -------------------------------
echo "==> scaffolding a consumer in $WORK"
cd "$WORK"
cat > package.json <<'JSON'
{ "name": "rf-consumer", "private": true, "type": "module",
  "scripts": { "dev": "foundry dev", "build": "foundry build", "preview": "foundry preview" } }
JSON
mkdir -p src/components
cat > src/components/Button.tsx <<'TSX'
export function Button({ label }: { label: string }) {
  return <button type="button">{label}</button>
}
TSX
cat > src/components/Button.preview.tsx <<'TSX'
import { createPreview } from 'react-foundry'
import { Button } from './Button'
export const Basic = createPreview(() => <Button label="Hi" />)
TSX
# A bg override proves the theme channel end to end; a distinctive value to grep for.
cat > foundry.config.ts <<'TS'
import { defineConfig } from 'react-foundry'
export default defineConfig({
  title: 'Verify',
  port: 5177,
  theme: { colors: { light: { bg: '#123456' } } },
})
TS

echo "==> installing the tarball with npm (flat layout)"
npm install --no-audit --no-fund react react-dom "$TARBALL" >/dev/null 2>&1 \
  || fail "npm install of the tarball failed"
pass "installed react-foundry + react + react-dom"

# Snapshot the installed package to prove nothing writes into it at runtime.
snapshot() { find node_modules/react-foundry -type f -exec shasum {} \; | sort | shasum; }
BEFORE="$(snapshot)"

# --- 3. import prints nothing (cli.parse split) -------------------------------
echo "==> import side-effect check"
OUT="$(node -e "import('react-foundry').then(() => {})" 2>&1)"
[ -z "$OUT" ] || fail "importing react-foundry produced output (cli.parse leaked?): $OUT"
pass "import 'react-foundry' is side-effect-free"

# --- 4. foundry dev -----------------------------------------------------------
echo "==> foundry dev"
npx foundry dev > "$DEV_LOG" 2>&1 &
SERVER_PID=$!
# Poll the port for readiness rather than grepping the log for "Local:". Piped stdout is
# block-buffered (no TTY on CI), so that line can sit unflushed for the whole run even
# though the server is already listening; grepping it is unwinnable. The dev port is fixed
# by the consumer config written above (5177). A generous ceiling covers cold-runner dep
# pre-bundling; the loop breaks the instant the server answers.
DEV_PORT=5177
dev_ok=""
for _ in $(seq 1 90); do
  curl -fsS --max-time 5 "http://localhost:$DEV_PORT/" >/dev/null 2>&1 && { dev_ok=1; break; }
  sleep 1
done
[ -n "$dev_ok" ] || { cat "$DEV_LOG"; fail "dev server did not serve on :$DEV_PORT"; }
pass "dev server serving on :$DEV_PORT"

# Stop the server so its buffered stdout flushes to the log, then scan for the packaging
# landmine failures (they surface as these strings).
kill "$SERVER_PID" 2>/dev/null || true; SERVER_PID=""
sleep 1
for bad in "/@fs//" "Cannot find module" "was not allowed" "outside of Vite serving allow list"; do
  grep -qF "$bad" "$DEV_LOG" && { cat "$DEV_LOG"; fail "dev log contains '$bad'"; } || true
done
pass "no path / fs.strict / resolve errors in the dev log"

# --- 5. foundry build ---------------------------------------------------------
echo "==> foundry build"
npx foundry build > "$WORK/build.log" 2>&1 || { cat "$WORK/build.log"; fail "foundry build failed"; }
[ -f dist/index.html ] || fail "build produced no dist/index.html"
BUILT_CSS="$(find dist -name '*.css' | head -1)"
[ -n "$BUILT_CSS" ] || fail "build produced no CSS asset"
grep -q -- "--foundry-colors-bg" "$BUILT_CSS" || fail "built CSS missing the base theme vars"
grep -qF "#123456" "$BUILT_CSS" || fail "built CSS missing the consumer's bg override"
grep -q "data:font/woff2\|\.woff2" "$BUILT_CSS" || fail "built CSS missing the font"
pass "build emitted themed CSS with the override and font"

# --- 6. foundry preview -------------------------------------------------------
echo "==> foundry preview"
npx foundry preview > "$PREVIEW_LOG" 2>&1 &
SERVER_PID=$!
# Same port-polling as dev. `foundry preview` uses Vite's preview server, whose default
# port is 4173 (the config `port` applies to the dev server, not preview).
PREVIEW_PORT=4173
preview_ok=""
for _ in $(seq 1 60); do
  curl -fsS --max-time 5 "http://localhost:$PREVIEW_PORT/" >/dev/null 2>&1 && { preview_ok=1; break; }
  sleep 1
done
[ -n "$preview_ok" ] || { cat "$PREVIEW_LOG"; fail "preview server did not serve on :$PREVIEW_PORT"; }
pass "preview server serving on :$PREVIEW_PORT"
kill "$SERVER_PID" 2>/dev/null || true; SERVER_PID=""

# --- 7. the installed package is unchanged ------------------------------------
AFTER="$(snapshot)"
[ "$BEFORE" = "$AFTER" ] || fail "node_modules/react-foundry was mutated at runtime (routeTree / cacheDir wrote into the package)"
pass "installed package unchanged after dev + build + preview"

echo "PASS: react-foundry tarball verified in a clean consumer install."
