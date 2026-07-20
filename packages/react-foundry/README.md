# react-foundry

A lightweight component development environment for React. Point it at your
`*.preview.tsx` files and get a themed canvas, a typed navigation tree, and hot reload,
with no bundler config of your own.

## Install

```sh
npm install --save-dev react-foundry
```

`react` and `react-dom` are peer dependencies you already have.

## Usage

Add a `foundry.config.ts` at your project root:

```ts
import { defineConfig } from 'react-foundry'

export default defineConfig({
  previews: 'src/**/*.preview.tsx',
  title: 'My Components',
  nav: [{ label: 'Forms', children: [{ label: 'Button' }] }],
})
```

Write a preview next to a component:

```tsx
import { createPreview } from 'react-foundry'
import { Button } from './Button'

export const Basic = createPreview(() => <Button>Click me</Button>)
```

Then run the CLI:

```sh
foundry dev      # start the dev server
foundry build    # build a static preview site
foundry preview  # serve the built site
```

## Notes

- Foundry runs its own Vite pipeline. To extend it (add plugins, aliases, etc.), pass a
  partial Vite config via `viteConfig` in `defineConfig`. If your components author styles
  with vanilla-extract, add `@vanilla-extract/vite-plugin` there.
- The chrome ships precompiled, so nothing in `node_modules` needs to build on your
  machine.

## License

MIT
