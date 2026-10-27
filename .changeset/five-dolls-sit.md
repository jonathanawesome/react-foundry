---
"react-foundry": patch
---

Vite is now a peer dependency (`^8.0.0`). Foundry runs on your project's Vite instead of shipping its own, so the plugins in your `foundry.config.ts` and the server they run in share one copy.

