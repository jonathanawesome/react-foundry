/**
 * Stands in for `virtual:react-foundry-config`, which only exists at runtime via
 * an alias the CLI injects (see packages/cli/src/vite/create-config.ts). Without
 * it, any test that transitively imports a `.css.ts` fails to resolve the
 * specifier.
 */
export const themeColors = { dark: {}, light: {} }
export const foundryTitle = ''
export const foundryNav: unknown[] = []
