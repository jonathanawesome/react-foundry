import { useTheme } from '@react-foundry/style'

import { Icon, IconNames } from '../icon/icon'
import { useUIStore } from '../state'

import { navigationStyles } from './navigation.css'

type NavigationItemProps = {
  icon: IconNames
  onClick: () => void
  title: string
}

const NavigationItem = ({ icon, onClick, title }: NavigationItemProps) => {
  return (
    <button className={navigationStyles.item} onClick={onClick} title={title}>
      <Icon name={icon} size="medium" />
    </button>
  )
}

export const Navigation = () => {
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

      <NavigationItem
        icon="Accessibility"
        onClick={toggleAccessibility}
        title={
          isAccessibilityEnabled
            ? 'Disable Accessibility Check'
            : 'Enable Accessibility Check'
        }
      />
    </div>
  )
}
