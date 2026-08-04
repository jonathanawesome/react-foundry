// The app tree is the consumer's Vite input, so a bare `@tanstack/react-router` import
// there would land in their module graph and force our version on them. Routing it
// through here keeps the router an implementation detail of the client bundle: published
// consumers resolve `@react-foundry/ui` to that bundle, which has the router inlined.
export {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useMatch,
} from '@tanstack/react-router'

export { AccessibilityChecker } from './components/accessibility-checker'
export { Badge, type BadgeProps, type BadgeTone } from './components/badge'
export { ComponentLanding } from './components/component-landing'
export { ControlField } from './components/control-field'
// Components
export { Icon, type IconName, type IconProps } from './components/icon/icon'
export { IconButton, type IconButtonProps } from './components/icon-button'
export { Layout } from './components/layout'
export { Preview } from './components/preview'
export { PropsPanel } from './components/props-panel'
export { Scrollable, type ScrollableProps } from './components/scrollable'
export { Shelf } from './components/shelf'
export { Toolbar } from './components/toolbar'

// State
export { useUIStore } from './state'
