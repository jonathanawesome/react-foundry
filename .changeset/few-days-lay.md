---
"react-foundry": patch
---

TanStack Router is no longer part of your project's module graph.

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
