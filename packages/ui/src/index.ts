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

export { AccessibilityChecker } from './components/accessibility-checker/accessibility-checker'
export { Badge, type BadgeProps, type BadgeTone } from './components/badge/badge'
export { ComponentLanding } from './components/component-landing/component-landing'
export { ControlField } from './components/control-field/control-field'
// Components
export { Icon, type IconName, type IconProps } from './components/icon/icon'
export { IconButton, type IconButtonProps } from './components/icon-button/icon-button'
export { Layout } from './components/layout/layout'
export { ListField, type ListRowValue } from './components/list-field/list-field'
export { Preview } from './components/preview/preview'
export { PropsPanel } from './components/props-panel/props-panel'
export { Scrollable, type ScrollableProps } from './components/scrollable/scrollable'
export { Shelf } from './components/shelf/shelf'
export { Toolbar } from './components/toolbar/toolbar'
export { Tooltip, type TooltipProps } from './components/tooltip/tooltip'

// State
export { useUIStore } from './state'
