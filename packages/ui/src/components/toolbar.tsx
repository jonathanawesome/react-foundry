import { useTheme } from '@react-foundry/style'

import { useUIStore } from '../state'
import { IconButton } from './icon-button'
import { toolbarStyles } from './toolbar.css'

/**
 * The floating control bar: shelf and panel toggles, plus theme and
 * accessibility controls. The nav *tree* is the {@link Shelf}; this is the
 * chrome around it.
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

  return (
    <div className={toolbarStyles.container}>
      <IconButton
        icon="Notebook"
        onClick={toggleShelf}
        title="Toggle Component List"
        active={isShelfOpen}
      />

      <IconButton
        icon="Sliders"
        onClick={togglePanel}
        title="Toggle Controls Panel"
        active={isPanelOpen}
      />

      <div className={toolbarStyles.separator} aria-hidden />

      <IconButton
        icon={theme === 'dark' ? 'Sun' : 'Moon'}
        onClick={handleToggleTheme}
        title="Toggle Theme"
      />

      <IconButton
        icon="Wheelchair"
        onClick={toggleAccessibility}
        title={
          isAccessibilityEnabled
            ? 'Disable Accessibility Check'
            : 'Enable Accessibility Check'
        }
        active={isAccessibilityEnabled}
      />
    </div>
  )
}
