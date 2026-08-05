# react-foundry

## 0.0.10

### Patch Changes

- 156f5d3: Fixes and new API from a real migration onto foundry

## 0.0.9

### Patch Changes

- e93fe6a: Fix a crash on first load when installed from npm. The `use-sync-external-store` shim was inlined into the client bundle as CommonJS, leaving a `require("react")` call that throws in the browser. It is now external and resolves from foundry's own dependencies.

## 0.0.8

### Patch Changes

- 0dc7539: TanStack Router is no longer part of your project's module graph.

  Foundry's shell is built on TanStack Router, but that was leaking out: the
  app tree and the client bundle both carried bare `@tanstack/react-router`
  imports your Vite had to resolve, held together by a forced `dedupe` you
  could add to but never remove.

  If you use TanStack Router yourself, this was worse than overhead. Dedupe
  resolved the router from foundry's own directory, so a previewed component
  bound to foundry's copy and its provider. Calling `useParams()` in a preview
  didn't throw, it quietly returned the shell's own route params. Your previews
  now get your version and your context.

  If you don't use it, it's simply gone: `react-foundry` no longer depends on
  `@tanstack/react-router` or `@tanstack/react-store`, and neither is
  pre-bundled into your dev server.

  No API change, and nothing to do on your end.

- fee9468: Prune stale navigation UI state

## 0.0.7

### Patch Changes

- 9a50835: Document the a11y checker and style isolation
- ec0ad5e: Locate accessibility violations in the preview canvas, and reporthonestly on what was measured.

## 0.0.6

### Patch Changes

- 449088a: Fix router basepath

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
