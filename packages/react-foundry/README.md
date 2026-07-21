# react-foundry

A lightweight component development environment for React. Write a preview as a plain
React component and it shows up on a canvas, in a navigation tree you define. No bundler
config of your own.

- **Auto-discovery** — finds your `.preview.tsx` files automatically
- **Your navigation** — declare the tree in config; array order is display order
- **One primitive** — a preview is just a React component, hooks and all
- **Typed nav paths** — a misplaced preview is a compile error, with autocomplete
- **Theming** — light/dark/system, driven by a few role-named color tokens
- **Accessibility** — an integrated axe-core checker
- **Fast** — built on Vite; the chrome ships precompiled, so nothing builds in your `node_modules`

## Install

```sh
npm install --save-dev react-foundry
```

`react` and `react-dom` are peer dependencies you already have (React 18 or 19).

## Quick start

Point your scripts at the `foundry` binary:

```json
{
  "scripts": {
    "dev": "foundry dev",
    "build": "foundry build",
    "preview": "foundry preview"
  }
}
```

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
import { createPreview, type NavPath } from 'react-foundry'
import { Button } from './button'

export const nav: NavPath = 'Forms/Button'

export const Primary = createPreview(() => <Button variant="primary">Go</Button>)
```

Run `npm run dev` and it appears on the canvas under **Forms → Button → Primary**.

## CLI

Each command takes an optional `[root]` argument, defaulting to the current directory:

- `foundry dev [root]` — start the dev server (also `foundry serve`, or just `foundry`)
- `foundry build [root]` — build a static bundle for production
- `foundry preview [root]` — serve the production build locally

## Configuration

Create a `foundry.config.ts` in your project root:

```ts
import { defineConfig } from 'react-foundry'

export default defineConfig({
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  title: 'My Components',
  nav: [
    { label: 'Foundations', children: [{ label: 'Colors' }, { label: 'Typography' }] },
    { label: 'Forms', children: [{ label: 'Button' }, { label: 'Input' }] },
  ],
  theme: {
    colors: {
      light: { accent: '#0ea5e9' },
      dark: { accent: 'oklch(70% 0.15 240)' },
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
| `navTypesPath` | inferred | Exact path for the generated `NavPath` types. Defaults next to your previews; override for layouts the inference can't reach. Requires restart. |
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

### Navigation

`nav` declares the shape of the shelf, nested as deeply as you like. **Array order is
display order**, so you control where a section sits without renaming anything.

Every path in the tree, including parents, becomes part of a generated `NavPath` union that
preview files check against. Foundry writes it to `src/foundry-nav.gen.d.ts` (or the project
root if you have no `src/`) on every server start and whenever the config changes, so a
mistyped path is a compile error with autocomplete rather than a preview quietly landing in
the wrong place. **Add that file to your `.gitignore`.**

`nav` is optional. Without it, `NavPath` stays `string` and the tree is inferred from the
`nav` values your previews declare, sorted alphabetically. A preview whose path is not in the
config still appears, appended at the end with a warning, so nothing is ever silently
dropped.

#### Monorepo layouts

Declaration merging only narrows `NavPath` inside a TypeScript project that compiles both the
generated file and your `.preview.tsx` files. When your config lives in one package but the
previews live in another (say the config is in `apps/foundry` and previews in
`packages/react/src`), Foundry writes `foundry-nav.gen.d.ts` **next to the previews** by
inferring the directory from the `previews` glob base, so the previews' own tsconfig picks up
the augmentation with no extra setup.

Because that augmentation binds during the **previews' package** compilation, `react-foundry`
must be a dependency of that package too, not only the app that holds `foundry.config.ts`. Add
it as a `devDependency` where the previews live, or `createPreview` and `NavPath` resolve to
`Cannot find module 'react-foundry'` (TS2307) across every preview file.

If that inference can't reach the right place, set `navTypesPath` to the exact output file,
resolved against the config root:

```ts
export default defineConfig({
  previews: '../../packages/react/src/**/*.preview.tsx',
  navTypesPath: '../../packages/react/src/foundry-nav.gen.d.ts',
})
```

Either way, **add the generated file to that package's `.gitignore`.** Symlinked workspace
previews are served with no extra config: foundry detects your workspace root and adds it to
Vite's file-serving allow-list automatically. Only reach for `viteConfig.server.fs.allow` if
previews live outside that detected root.

### Theming

Foundry's shell derives its palette from a few role-named tokens, set independently for
`light` and `dark`. Values accept any CSS color (hex, `rgb()`, `hsl()`, `oklch()`, named
colors) or a bare OKLCH triplet.

**Anchors** — set these to shift the whole ramp at once:

| Token | Role |
| --- | --- |
| `bg` | base surface / paper pole |
| `fg` | strong text / ink pole |
| `accent` | focus rings, links, active states |

**Surfaces and text** — derived from the anchors by default; override any one for precision:

| Token | Role |
| --- | --- |
| `canvas` | the backdrop behind your preview |
| `panel` | shelf, props panel, and dock backgrounds |
| `border` | inputs, dividers, panel edges |
| `textMuted` / `textBody` / `textStrong` | secondary / body / emphasis text |

```ts
theme: {
  colors: {
    light: { canvas: '#faf9f7', accent: '#0ea5e9' },
    dark: { canvas: '#0b0b0c', accent: '#38bdf8' },
  },
  fonts: { sans: 'Inter, sans-serif' },
}
```

Overriding an **anchor** (`bg`/`fg`/`accent`) recomputes every derived token in the browser,
so the whole shell shifts from one or two values. Overriding a **specific token** (like
`canvas`) pins just that one. The surfaces and text mix in OKLCH internally, but you never
have to: pass plain hex.

**Fonts** (`sans`, `mono`) are mode-agnostic: one value for both themes. Foundry bundles
Instrument Sans; if you point `sans` at another family, make sure it is actually available (a
system font, your own `@font-face`, or a font-host link), since foundry can't bundle it for
you.

## Creating component previews

A preview is a React component that fills the canvas. Create a `.preview.tsx` file alongside
your component, place it in the tree with a `nav` export, and wrap each preview in
`createPreview`:

```tsx
import { createPreview, type NavPath } from 'react-foundry'
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

### Controls

Give a preview editable controls with `defineControls`, and `render` receives their live
values:

```tsx
import { createPreview, defineControls } from 'react-foundry'
import { Button } from './button'

export const Playground = createPreview({
  controls: defineControls({
    variant: { type: 'select', options: ['primary', 'danger'], default: 'primary' },
    disabled: { type: 'boolean', default: false },
    label: { type: 'text', default: 'Click me' },
  }),
  render: (values) => (
    <Button variant={values.variant} disabled={values.disabled}>
      {values.label}
    </Button>
  ),
})
```

Values are typed from the schema, so `values.variant` narrows to `'primary' | 'danger'`
and a typo is a compile error. Control types: `text`, `boolean`, `number`, `range`, `select`,
`radio`, `color`.

## Providers

Your components often rely on app-wide React context: a design-system theme provider, a
data client, i18n, a router. Give foundry a `foundry.providers.tsx` at your project root
that exports a `Provider`, and it wraps every preview in it, so components render the same
way they do in your real app.

```tsx
import type { FoundryProvider } from 'react-foundry'
import { ThemeProvider } from '@my/design-system'
import { QueryClientProvider } from '@my/data'

export const Provider: FoundryProvider = ({ children, theme }) => (
  <ThemeProvider mode={theme}>
    <QueryClientProvider>{children}</QueryClientProvider>
  </ThemeProvider>
)
```

- **`theme`** is foundry's resolved mode (`'light' | 'dark'`), so a design-system provider
  can track foundry's own light/dark toggle. Ignore it if you don't need it.
- The provider wraps **inside** the preview canvas, so it reaches your components without
  foundry's own chrome resets touching them.
- The file is **optional**. Without it, previews render unchanged.

The file may be `foundry.providers.{tsx,jsx,ts,js}`. Editing it hot-reloads. Two things to
know for a real project:

- The first time you add the file, foundry pulls its new dependencies into the graph, so
  Vite may re-optimize and reload once more than usual. That is expected, not a bug.
- If your provider imports **workspace** packages symlinked outside your project root,
  foundry serves them automatically by allow-listing your detected workspace root. Only if
  they live outside that root do you need to extend `viteConfig.server.fs.allow`.

## Extending Vite

Foundry runs its own Vite pipeline. To extend it (plugins, aliases, etc.), pass a partial
Vite config via `viteConfig`:

```ts
export default defineConfig({
  viteConfig: {
    plugins: [/* your plugins */],
    resolve: { alias: { '@': '/src' } },
  },
})
```

If your components author their own styles with vanilla-extract, add its plugin here:

```ts
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

export default defineConfig({
  viteConfig: { plugins: [vanillaExtractPlugin()] },
})
```

Provide a single React plugin instance only through `viteConfig` if you need to configure it;
foundry already includes `@vitejs/plugin-react`, so don't add a second copy.

## License

MIT
