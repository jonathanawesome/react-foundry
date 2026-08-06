---
"react-foundry": patch
---

Fix hot reloading in the preview canvas: component and preview edits now patch in place instead of doing nothing. Changing `previews`, `port` or `host` now warns that a restart is needed.
