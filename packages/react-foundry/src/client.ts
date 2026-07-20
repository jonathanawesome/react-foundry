// Entry for the Vite library build. Re-exporting the full style + ui surface pulls in
// every `.css.ts` (global, fonts, themes, and the ui component styles), which the VE
// plugin compiles into one `client.css`. The compiled `client.js` is what the shipped
// app tree's `@react-foundry/style` / `@react-foundry/ui` imports alias to at runtime.
export * from '@react-foundry/style'
export * from '@react-foundry/ui'
