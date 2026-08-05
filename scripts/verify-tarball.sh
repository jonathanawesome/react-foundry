#!/usr/bin/env bash
#
# Verifies the published `react-foundry` package by installing the packed tarball into a
# throwaway project OUTSIDE the monorepo (a flat npm layout, the opposite of the strict
# pnpm workspace) and driving `foundry dev | build | preview`. Every assertion maps to a
# packaging landmine: the .css.ts-in-node_modules failure, the monorepo path assumptions,
# fs.strict, the cacheDir writes, the cli.parse split, and foundry's own runtime deps
# leaking into the consumer's module graph.
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

# The app tree is compiled by the consumer's Vite and the client bundle is imported by it,
# so a bare specifier in either is one their resolver has to satisfy. The router is bundled
# into dist/client precisely so it never becomes their problem. main.tsx's `declare module`
# is exempt: it is type-only and erases at transform, so it has no `from` clause to match.
DIST="$REPO_ROOT/packages/react-foundry/dist"
BARE_TANSTACK="$(grep -rlE "from ['\"]@tanstack/" "$DIST" || true)"
[ -z "$BARE_TANSTACK" ] || fail "a bare @tanstack import survives in dist: $BARE_TANSTACK"
pass "dist carries no bare @tanstack import"

# A CJS dependency lands inlined in dist/client only when it was left off the external list
# in vite.client.config.ts, and a CJS module that require()s an externalized package makes
# rolldown emit its require helper, which throws the moment the browser reaches it. Both are
# runtime failures on the consumer's very first page load, and both are invisible to build,
# pack, and every check below: the demos alias to workspace source, so nothing else in the
# repo ever loads this bundle. use-sync-external-store shipped inlined this way in 0.0.8,
# arriving through the bundled router's @tanstack/react-store.
CJS_REGION="$(grep -rlE '//#region .*/cjs/' "$DIST/client" || true)"
[ -z "$CJS_REGION" ] || fail "an inlined CJS region survives in dist/client: $CJS_REGION"
pass "dist/client carries no inlined CJS region"

# Matched on the helper's error string: its identifier is minified and renames every build.
REQUIRE_HELPER="$(grep -rlF "doesn't expose the \`require\` function" "$DIST/client" || true)"
[ -z "$REQUIRE_HELPER" ] || fail "a rolldown require helper survives in dist/client: $REQUIRE_HELPER"
pass "dist/client carries no require helper"

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

# The cleanest single proof that foundry's shell is not the consumer's problem. Foundry is
# built on TanStack Router, and a consumer who uses it themselves must get their own copy
# and their own context; one who does not should never see it.
[ ! -e node_modules/@tanstack ] \
  || fail "installing react-foundry pulled in @tanstack: $(ls node_modules/@tanstack)"
pass "the install pulled in no @tanstack package"

# Snapshot the installed package to prove nothing writes into it at runtime.
snapshot() { find node_modules/react-foundry -type f -exec shasum {} \; | sort | shasum; }
BEFORE="$(snapshot)"

# --- 3. import side effects and reported version ------------------------------
echo "==> import side-effect check"
OUT="$(node -e "import('react-foundry').then(() => {})" 2>&1)"
[ -z "$OUT" ] || fail "importing react-foundry produced output (cli.parse leaked?): $OUT"
pass "import 'react-foundry' is side-effect-free"

# The version is read from the package's own manifest at startup, which only works if the
# relative path holds in the PUBLISHED layout (bundled into dist/cli.js, manifest one level
# up). The unit test can only prove the source layout, so this is the half that matters:
# a wrong path here degrades to 'unknown' silently. The literal it replaced sat at 0.0.1
# through nine releases.
#
# Captured into a variable rather than piped into `grep -q`. Under `set -o pipefail` a
# `-q` grep exits on the first match and closes the pipe, so `npx` can take SIGPIPE and
# fail the whole pipeline on a *passing* check. Capturing also means the failure message
# reports the output actually tested rather than a second invocation's.
EXPECTED_VERSION="$(node -p "require('./node_modules/react-foundry/package.json').version")"
REPORTED_VERSION="$(npx foundry --version 2>&1)"
case "$REPORTED_VERSION" in
  *"foundry/$EXPECTED_VERSION"*) ;;
  *) fail "foundry --version did not report $EXPECTED_VERSION (got: $REPORTED_VERSION)" ;;
esac
pass "foundry --version reports $EXPECTED_VERSION"

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
# "process is not defined" covers the router now being inlined into the client bundle
# rather than prebundled from the consumer's node_modules: its `process.env.NODE_ENV`
# guards are no longer substituted by esbuild, and rely on Vite's dev env shim instead.
for bad in "/@fs//" "Cannot find module" "was not allowed" \
  "outside of Vite serving allow list" "process is not defined"; do
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
[ "$BEFORE" = "$AFTER" ] || fail "node_modules/react-foundry was mutated at runtime (cacheDir wrote into the package)"
pass "installed package unchanged after dev + build + preview"

echo "PASS: react-foundry tarball verified in a clean consumer install."
