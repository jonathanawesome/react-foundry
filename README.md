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

## Packages

- **@react-foundry/cli** - The `foundry` binary. Loads your config, runs the Vite dev/build/preview pipeline, exposes preview and config discovery as virtual modules, and serves the TanStack Router app that renders the environment.
- **@react-foundry/core** - `createPreview`, the nav tree types, and the discovery logic that builds the tree
- **@react-foundry/ui** - UI components for the preview environment (shelf, navigation, preview pane, accessibility checker)
- **@react-foundry/style** - Theme system and styling utilities (Vanilla Extract)

## Apps

- **demo** - Demo application for dogfooding

## Getting Started

Add the CLI to your project and point your scripts at the `foundry` binary:

```json
{
  "scripts": {
    "dev": "foundry dev",
    "build": "foundry build",
    "preview": "foundry preview"
  }
}
```

Each command takes an optional `[root]` argument, defaulting to the current directory:

- `foundry dev [root]` - start the dev server (also available as `foundry serve`, or just `foundry`)
- `foundry build [root]` - build a static bundle for production
- `foundry preview [root]` - serve the production build locally

## Configuration

Create a `foundry.config.ts` in your project root:

```ts
import { defineConfig } from '@react-foundry/cli'

export default defineConfig({
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  title: 'Demo Components',
  nav: [
    { label: 'Foundations', children: [{ label: 'Colors' }, { label: 'Typography' }] },
    { label: 'Forms', children: [{ label: 'Button' }, { label: 'Input' }] },
  ],
  theme: {
    colors: {
      light: { brand: '#0ea5e9' },
      dark: { brand: 'oklch(70% 0.15 240)' },
    },
  },
})
```

| Option | Default | Notes |
| --- | --- | --- |
| `previews` | `'src/components/**/*.preview.tsx'` | Glob for preview files. Requires restart. |
| `nav` | `[]` | The navigation tree. Hot-reloadable; the shelf and the generated `NavPath` union both update on save. |
| `port` | `5173` | Dev server port. Requires restart. |
| `host` | `'localhost'` | Dev server host. Requires restart. |
| `title` | none | Display title for the instance. Hot-reloadable. |
| `theme` | none | Theme customization. Hot-reloadable. |
| `viteConfig` | none | Vite config overrides. Requires restart. |

### Navigation

`nav` declares the shape of the shelf, nested as deeply as you like. **Array order is display order**, so you control where a section sits without renaming anything.

Every path in the tree, including parents, becomes part of a generated `NavPath` union that preview files check against. Foundry writes it to `src/foundry-nav.gen.d.ts` (or the project root if you have no `src/`) on every server start and whenever the config changes, so a mistyped path is a compile error with autocomplete rather than a preview quietly landing in the wrong place. Add that file to your `.gitignore`.

`nav` is optional. Without it, `NavPath` stays `string` and the tree is inferred from the `nav` values your previews declare, sorted alphabetically. A preview whose path is not in the config still appears, appended at the end with a warning, so nothing is ever silently dropped.

Config files are resolved in this order, first match wins:

```
foundry.config.mjs
foundry.config.js
foundry.config.ts
.foundry/config.mjs
.foundry/config.js
.foundry/config.ts
```

### Theme colors

Overridable tokens are `neutral1` through `neutral8` plus `brand`, each settable independently for `light` and `dark`. Values accept any valid CSS color (hex, `rgb()`, `hsl()`, `oklch()`, named colors) or a raw OKLCH triplet:

```ts
theme: {
  colors: {
    light: { brand: '62.1% 0.289482 350.9' },
  },
}
```

## Creating Component Previews

A preview is a React component that fills the canvas. Create a `.preview.tsx` file alongside your component, place it in the tree with a `nav` export, and wrap each preview in `createPreview`:

```tsx
import { createPreview, type NavPath } from '@react-foundry/core'
import { useState } from 'react'
import { Button } from './button'

export const nav: NavPath = 'Forms/Button'

export const Primary = createPreview(() => <Button variant="primary">Go</Button>)
export const Danger = createPreview(() => <Button variant="danger">Careful</Button>)

// Hooks work. There is no separate concept for a preview that holds state.
export const Counter = createPreview(() => {
  const [count, setCount] = useState(0)
  return <Button onClick={() => setCount(count + 1)}>Clicked {count}</Button>
})

// Use the options form when the export name cannot express the label.
export const AllSizes = createPreview({
  label: 'Every Size',
  render: () => (
    <>
      {sizes.map((size) => (
        <Button key={size} size={size} />
      ))}
    </>
  ),
})

// Exported but not wrapped, so this is not a nav entry.
export const sizes = ['small', 'medium', 'large'] as const
```

That renders as:

```
Forms
  Button
    Primary
    Danger
    Counter
    Every Size
```

The rules:

- **`nav` places the file.** It is typed against your config, so it autocompletes. Omit it and the filename is used instead.
- **Only exports wrapped in `createPreview` become previews.** Helpers, fixtures, and constants can live in the same file without leaking into the shelf.
- **Labels come from export names**, de-camelCased: `AllSizes` becomes `All Sizes`. Pass `label` to override.
- **Order is what you wrote.** Previews appear in source order, sections in config order. Nothing is sorted behind your back.
- **URLs use the export name, never the label.** `AllSizes` lives at `/Forms/Button/AllSizes` whatever you label it, so rewording a label never breaks a link.

## Project Structure

```
react-foundry/
├── packages/
│   ├── cli/     # foundry binary, Vite pipeline, app shell
│   ├── core/    # createPreview, nav tree types, discovery
│   ├── ui/      # Preview UI components
│   └── style/   # Theme system
└── apps/
    └── demo/    # Example usage
```

## Development

Requires Node >= 22 and pnpm 10.x.

```bash
pnpm install    # install dependencies
pnpm demo       # run the demo app against the local CLI
pnpm test       # run all package test suites (vitest)
pnpm types      # typecheck every package
pnpm check      # lint and format check (biome)
pnpm check:fix  # apply lint and format fixes
pnpm validate   # types + check
```
