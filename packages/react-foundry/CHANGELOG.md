# react-foundry

## 0.0.5

### Patch Changes

- e31cd97: Fix two pnpm-monorepo dev-server issues: pre-bundle and dedupe foundry's own app-shell runtime, and confine foundry's CSS to its chrome so previews render as they do in the consumer's app.

## 0.0.4

### Patch Changes

- 3134fcc: The `viteConfig` field on `FoundryConfig` is now typed against Vite 8's`UserConfig`, so plugins and config from a Vite 8 consumer type-check againstthe Vite version foundry actually runs.
- 885a266: Foundry now detects your monorepo workspace root (via Vite's own searchForWorkspaceRoot) and adds it to server.fs.allow automatically, so previews and providers that import symlinked workspace packages are served without hand-adding server.fs.allow to viteConfig. Outside a workspace this is a no-op.

## 0.0.3

### Patch Changes

- d8c30e9: Add demos
- 8495a32: Fix typed NavPath for monorepos where previews live in a separate package. Adds optional `navTypesPath` override.

## 0.0.2

### Patch Changes

- 8548846: Preview modules now load on demand
- 11ebc8c: Adds the ability to wrap all previews in Providers
