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

- **@react-foundry/core** - Core component discovery and preview logic
- **@react-foundry/ui** - UI components for the preview environment
- **@react-foundry/style** - Theming and styling utilities (Vanilla Extract)
- **@react-foundry/eslint-config** - Shared ESLint configuration

## Apps

- **demo** - Demo application for dogfooding

## Getting Started

```bash
# Install dependencies
pnpm install

# Run demo app
pnpm demo

# Build all packages
pnpm build
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

## Project Structure

```
react-foundry/
├── packages/
│   ├── core/          # Discovery & preview types
│   ├── ui/            # Preview UI components
│   ├── style/         # Theme system
│   └── eslint-config/ # Linting rules
└── apps/
    └── demo/          # Example usage
```
