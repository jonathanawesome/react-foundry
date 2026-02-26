// import and reexport VE bits (we'll manage all VE bits here in style)

export { globalStyle, keyframes, style } from '@vanilla-extract/css'
export { type RecipeVariants, recipe } from '@vanilla-extract/recipes'

// Global styles
import './global-styles.css'

// Fonts
import './fonts.css'

// Theme contract and implementations
export { type ColorToken, themeContract } from './theme-contract.css'
export type { Theme, ThemeContextValue } from './theme-provider'

// Theme provider and hook
export { ThemeContext, ThemeProvider } from './theme-provider'
export { darkTheme, lightTheme } from './themes.css'
export { useTheme } from './use-theme'
