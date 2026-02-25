import { useTheme } from '@react-foundry/style'

import { useUIStore } from '../../state'

import { navigationStyles } from './navigation.css'
import { NavigationItem } from './navigation-item'

type NavigationProps = {
  showAccessibilityButton?: boolean
}

export const Navigation = ({ showAccessibilityButton = false }: NavigationProps) => {
  const {
    isAccessibilityEnabled,
    isShelfPinned,
    isShelfOpen,
    setIsShelfPinned,
    toggleAccessibility,
    toggleShelf,
  } = useUIStore()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleToggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  return (
    <div className={navigationStyles.container}>
      {isShelfOpen && !isShelfPinned && (
        <NavigationItem
          icon="Pin"
          onClick={() => setIsShelfPinned(true)}
          title={isShelfPinned ? 'Unpin and close shelf' : 'Pin shelf'}
        />
      )}

      <NavigationItem
        icon="Settings2"
        onClick={() => {
          if (isShelfPinned) {
            setIsShelfPinned(false)
            toggleShelf()
          } else {
            toggleShelf()
          }
        }}
        title="Open Component List"
      />

      <NavigationItem
        icon={theme === 'dark' ? 'Sun' : 'Moon'}
        onClick={handleToggleTheme}
        title="Toggle Theme"
      />

      {showAccessibilityButton && (
        <NavigationItem
          icon="Accessibility"
          onClick={toggleAccessibility}
          title={
            isAccessibilityEnabled
              ? 'Disable Accessibility Check'
              : 'Enable Accessibility Check'
          }
        />
      )}
    </div>
  )
}
