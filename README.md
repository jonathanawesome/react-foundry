# React Foundry

A lightweight, Ladle-like component development environment for React. Automatically discover and preview your React components with variants and demos.

## Features

- 🔍 **Auto-discovery** - Automatically finds `.preview.tsx` files in your project
- 🎨 **Theme Support** - Built-in light/dark/system theme switching
- ♿ **Accessibility** - Integrated axe-core accessibility checker
- 🏗️ **Variants & Demos** - Define component variants and interactive demos
- 📱 **Responsive** - Collapsible sidebar with pinning support
- ⚡ **Fast** - Built with Vite and modern React

## Packages

- **@react-foundry/cli** - The `foundry` binary. Loads your config, runs the Vite dev/build/preview pipeline, exposes preview and theme discovery as virtual modules, and serves the TanStack Router app that renders the environment.
- **@react-foundry/core** - Preview types and the component discovery logic
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
| `port` | `5173` | Dev server port. Requires restart. |
| `host` | `'localhost'` | Dev server host. Requires restart. |
| `title` | none | Display title for the instance. Hot-reloadable. |
| `theme` | none | Theme customization. Hot-reloadable. |
| `viteConfig` | none | Vite config overrides. Requires restart. |

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

Create a `.preview.tsx` file alongside your component:

```tsx
import { createPreview } from '@react-foundry/core'
import { Button } from './button'

export default createPreview({
  title: 'Button',
  component: Button,
  category: 'UI Components',
  variants: [
    { name: 'Primary', props: { variant: 'primary' } },
    { name: 'Secondary', props: { variant: 'secondary' } }
  ],
  demos: [{
    name: 'Interactive Example',
    render: () => (
      <div>
        <Button onClick={() => alert('Clicked!')}>
          Click me
        </Button>
      </div>
    )
  }]
})
```

`category` is optional and defaults to `Components`. It controls how previews are grouped in the shelf.

## Project Structure

```
react-foundry/
├── packages/
│   ├── cli/     # foundry binary, Vite pipeline, app shell
│   ├── core/    # Discovery & preview types
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

Linting and formatting are handled by [Biome](https://biomejs.dev), not ESLint/Prettier.
