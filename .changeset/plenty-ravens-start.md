---
"react-foundry": patch
---

The `viteConfig` field on `FoundryConfig` is now typed against Vite 8's`UserConfig`, so plugins and config from a Vite 8 consumer type-check againstthe Vite version foundry actually runs.
