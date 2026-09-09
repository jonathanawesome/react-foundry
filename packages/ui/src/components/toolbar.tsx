import { chromeSurfaceProps, useTheme } from '@react-foundry/style'

import { useUIStore } from '../state'
import { IconButton, type IconButtonProps } from './icon-button'
import { toolbarStyles } from './toolbar.css'
import { TOOLBAR_SHORTCUTS, useToolbarShortcuts } from './toolbar-shortcuts'
import { Tooltip } from './tooltip'

interface ToolbarButtonProps extends Omit<IconButtonProps, 'nativeTooltip'> {
  shortcut: string
}

/**
 * A toolbar control and the tooltip describing it.
 *
 * Paired here so the label is written once and cannot end up describing one
 * button while naming another. The native tooltip is off because this one
 * replaces it; left on, both would stack up on hover.
 */
const ToolbarButton = ({ shortcut, title, ...props }: ToolbarButtonProps) => (
  <Tooltip label={title} shortcut={shortcut}>
    <IconButton {...props} title={title} nativeTooltip={false} />
  </Tooltip>
)

/**
 * The floating control bar: shelf and panel toggles, plus theme and
 * accessibility controls. The nav *tree* is the {@link Shelf}; this is the
 * chrome around it.
 *
 * Also the host for the keyboard shortcuts, since it is mounted for the whole
 * session and owns every action they fire.
 */
export const Toolbar = () => {
  const isAccessibilityEnabled = useUIStore.use.isAccessibilityEnabled()
  const isShelfOpen = useUIStore.use.isShelfOpen()
  const isPanelOpen = useUIStore.use.isPanelOpen()
  const toggleAccessibility = useUIStore.use.toggleAccessibility()
  const toggleShelf = useUIStore.use.toggleShelf()
  const togglePanel = useUIStore.use.togglePanel()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleToggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  useToolbarShortcuts({
    shelf: toggleShelf,
    panel: togglePanel,
    theme: handleToggleTheme,
    accessibility: toggleAccessibility,
  })

  return (
    <div {...chromeSurfaceProps(toolbarStyles.container)}>
      <ToolbarButton
        icon="Notebook"
        onClick={toggleShelf}
        title="Toggle Component List"
        shortcut={TOOLBAR_SHORTCUTS.shelf}
        active={isShelfOpen}
      />

      <ToolbarButton
        icon="Sliders"
        onClick={togglePanel}
        title="Toggle Controls Panel"
        shortcut={TOOLBAR_SHORTCUTS.panel}
        active={isPanelOpen}
      />

      <div className={toolbarStyles.separator} aria-hidden />

      <ToolbarButton
        icon={theme === 'dark' ? 'Sun' : 'Moon'}
        onClick={handleToggleTheme}
        title="Toggle Theme"
        shortcut={TOOLBAR_SHORTCUTS.theme}
      />

      <ToolbarButton
        icon="Wheelchair"
        onClick={toggleAccessibility}
        title={
          isAccessibilityEnabled
            ? 'Disable Accessibility Check'
            : 'Enable Accessibility Check'
        }
        shortcut={TOOLBAR_SHORTCUTS.accessibility}
        active={isAccessibilityEnabled}
      />
    </div>
  )
}
