// import and reexport VE bits (we'll manage all VE bits here in style)
export { recipe, type RecipeVariants } from '@vanilla-extract/recipes'
export { globalStyle, keyframes, style } from '@vanilla-extract/css'

// Global styles
import './global-styles.css'

// Fonts
import './fonts.css'

// Theme contract and implementations
export { themeContract } from './theme-contract.css'
export { lightTheme, darkTheme } from './themes.css'

// Theme provider and hook
export { ThemeProvider, ThemeContext } from './theme-provider'
export type { Theme, ThemeContextValue } from './theme-provider'
export { useTheme } from './use-theme'
