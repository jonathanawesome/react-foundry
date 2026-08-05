#!/usr/bin/env bash
#
# Runs apps/demo against the PUBLISHED client bundle instead of workspace source.
#
# In the normal monorepo flow `isDevSource()` is true, so `clientAliases` in
# src/vite/create-config.ts is empty and @react-foundry/style|ui|core resolve to workspace
# source. Nothing in the repo ever loads dist/client/client.js: `pnpm demo`, `pnpm test`
# and `pnpm validate` all miss it entirely. That is how the CJS use-sync-external-store
# bug reached a release. Before this, touching that bundle at all meant packing a tarball
# and installing it into a scratch project (scripts/verify-tarball.sh).
#
# Invoking the compiled CLI directly is what selects published mode. `FOUNDRY_DEV_SOURCE=0`
# is NOT enough: create-config derives its paths from its own import.meta.url, so forcing
# the flag while running from src/ would alias to src/client, which does not exist. Running
# dist/cli.js puts `here` at dist/, where the client bundle and app tree actually live.
#
# Usage: bash scripts/exercise-dist-client.sh [build|dev]   (default: build)
#
#   build  Production build of the demo against the published bundle. Fast, and safe to
#          automate: it proves the bundle resolves, imports and bundles cleanly.
#   dev    Dev server against the published bundle, for looking at it in a real browser.
#
# What this does NOT cover: neither mode executes the bundle in a browser. The CJS failure
# was a runtime one (named ESM exports resolving to nothing on first paint), and only `dev`
# plus a human, or a headless browser, would catch its like. The build-time greps in
# verify-tarball.sh cover that specific shape.

set -euo pipefail

MODE="${1:-build}"
case "$MODE" in
  build | dev) ;;
  *)
    echo "usage: bash scripts/exercise-dist-client.sh [build|dev]" >&2
    exit 1
    ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$REPO_ROOT/packages/react-foundry/dist/cli.js"
CLIENT="$REPO_ROOT/packages/react-foundry/dist/client/client.js"

echo "==> building react-foundry"
pnpm --filter react-foundry build >/dev/null

[ -f "$CLI" ] || { echo "FAIL: no compiled CLI at $CLI" >&2; exit 1; }
[ -f "$CLIENT" ] || { echo "FAIL: no client bundle at $CLIENT" >&2; exit 1; }

echo "==> running the demo in published mode ($MODE)"
cd "$REPO_ROOT/apps/demo"
exec node "$CLI" "$MODE"
