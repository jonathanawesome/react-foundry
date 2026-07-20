# React Foundry

A lightweight component development environment for React. Write a preview as a plain React component and it shows up on a canvas, in a navigation tree you define.

## Features

- **Auto-discovery** - Automatically finds `.preview.tsx` files in your project
- **Your navigation** - Declare the tree in config; array order is display order
- **One primitive** - A preview is just a React component, hooks and all
- **Typed nav paths** - Misplaced previews are compile errors, with autocomplete
- **Theme Support** - Built-in light/dark/system theme switching
- **Accessibility** - Integrated axe-core accessibility checker
- **Responsive** - Collapsible sidebar with pinning support
- **Fast** - Built with Vite and modern React

## Usage

Foundry ships as a single package, [`react-foundry`](https://www.npmjs.com/package/react-foundry).

```sh
npm install --save-dev react-foundry
```

```ts
// foundry.config.ts
import { defineConfig } from 'react-foundry'

export default defineConfig({
  previews: 'src/**/*.preview.tsx',
  title: 'My Components',
  nav: [{ label: 'Forms', children: [{ label: 'Button' }] }],
})
```

Point your scripts at the `foundry` binary (`foundry dev` / `build` / `preview`) and write a
preview next to a component with `createPreview`. **See the [package README](packages/react-foundry/README.md)
for the full guide** - CLI, configuration, navigation, theming, controls, and extending Vite.

## Packages

`react-foundry` is the one installable package. The rest are internal to this monorepo and
bundled into it at build; they are not published separately.

- **[react-foundry](packages/react-foundry)** - The published package. The `foundry` binary, the Vite dev/build/preview pipeline, preview and config discovery as virtual modules, and the TanStack Router app that renders the environment. Precompiles and bundles the three internal packages below.
- **@react-foundry/core** *(internal)* - `createPreview`, the nav tree types, and the discovery logic that builds the tree
- **@react-foundry/ui** *(internal)* - UI components for the preview environment (shelf, navigation, preview pane, accessibility checker)
- **@react-foundry/style** *(internal)* - Theme system and styling utilities (Vanilla Extract)

## Apps

- **demo** - Demo application for dogfooding, run against the local `react-foundry` package

## Project Structure

```
react-foundry/
├── packages/
│   ├── react-foundry/  # published package: foundry binary, Vite pipeline, app shell, bundled chrome
│   ├── core/           # createPreview, nav tree types, discovery
│   ├── ui/             # preview UI components
│   └── style/          # theme system
└── apps/
    └── demo/           # example usage / dogfooding
```

## Development

Requires Node >= 22 and pnpm 10.x.

```bash
pnpm install    # install dependencies
pnpm demo       # run the demo app against the local react-foundry package
pnpm build      # build the publishable react-foundry package (dist/)
pnpm test       # run all package test suites (vitest)
pnpm types      # typecheck every package
pnpm check      # lint and format check (biome)
pnpm check:fix  # apply lint and format fixes
pnpm validate   # types + check
```

The demo resolves `react-foundry` to workspace source, so `pnpm demo` and `pnpm types` work
without a build; `pnpm build` is only needed to produce the publishable `dist/`.

## License

MIT
