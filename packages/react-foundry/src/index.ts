// The published package's public API. Side-effect-free: importing `react-foundry` runs
// nothing (the runnable CLI lives behind the bin, in ./cli). Everything here is the
// authoring/config surface a consumer imports into their foundry.config.ts and
// *.preview.tsx files. `@react-foundry/core` is bundled into this output at build.
export { createPreview, defineControls } from '@react-foundry/core'
// Imported from the `/types` subpath (where they're defined) rather than the barrel: the
// dts bundler drops types re-exported through core's index barrel, but resolves them
// cleanly one hop from the definition file.
export type {
  ControlDef,
  ControlSchema,
  ControlValue,
  ControlValues,
  NavPath,
  Preview,
  PreviewOptions,
  Register,
  RenderFn,
  ResolveNavPath,
} from '@react-foundry/core/types'
export { defineConfig } from './config/define-config'
export type { FoundryConfig, ThemeColors, ThemeConfig } from './types'
