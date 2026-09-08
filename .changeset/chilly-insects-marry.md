---
"react-foundry": patch
---

Fix previews that render through a portal losing their margin and padding. Menus, popovers, dropdowns and tooltips mount on `document.body` by default in Base UI, Radix and Floating UI, which puts them outside the preview canvas, where foundry's chrome reset was stripping their spacing. The reset is now scoped to foundry's own chrome rather than to everything that is not the canvas, so a portalled popup renders exactly as it does in your app.
