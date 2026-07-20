// Entry for the compiled core runtime. The shipped app tree's `@react-foundry/core`
// imports alias to this. `PREVIEW` is a global-registry symbol, so this being a separate
// copy from the public `index.ts` bundle does not break `isPreview`.
export * from '@react-foundry/core'
