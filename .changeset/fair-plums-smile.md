---
"react-foundry": patch
---

Previews mount `render` as a component, so hooks work without a wrapper and state survives Fast Refresh. Controls gain `derive`, `label`, and a `list` type. The props panel gets collapsible sections and an info mark showing each prop's TypeScript type and description, read through the project's `typescript` (an optional peer, `>=5.4`). Numbers and booleans are written to the URL bare, and tooltips render in a portal so they are never clipped.
