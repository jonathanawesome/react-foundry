---
"react-foundry": patch
---

Foundry now detects your monorepo workspace root (via Vite's own searchForWorkspaceRoot) and adds it to server.fs.allow automatically, so previews and providers that import symlinked workspace packages are served without hand-adding server.fs.allow to viteConfig. Outside a workspace this is a no-op.
