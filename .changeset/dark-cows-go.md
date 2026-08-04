---
"react-foundry": patch
---

Fix a crash on first load when installed from npm. The `use-sync-external-store` shim was inlined into the client bundle as CommonJS, leaving a `require("react")` call that throws in the browser. It is now external and resolves from foundry's own dependencies.
