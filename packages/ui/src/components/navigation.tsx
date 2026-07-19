import { useTheme } from '@react-foundry/style'
import { useUIStore } from '../state'
import { Icon, type IconName } from './icon/icon'

import { navigationStyles } from './navigation.css'

type NavigationItemProps = {
  icon: IconName
  onClick: () => void
  title: string
}

const NavigationItem = ({ icon, onClick, title }: NavigationItemProps) => {
  return (
    <button
      type="button"
      className={navigationStyles.item}
      onClick={onClick}
      title={title}
    >
      <Icon name={icon} size={'md'} />
    </button>
  )
}

export const Navigation = () => {
  const isAccessibilityEnabled = useUIStore.use.isAccessibilityEnabled()
  const isShelfPinned = useUIStore.use.isShelfPinned()
  const isShelfOpen = useUIStore.use.isShelfOpen()
  const setIsShelfPinned = useUIStore.use.setIsShelfPinned()
  const toggleAccessibility = useUIStore.use.toggleAccessibility()
  const toggleShelf = useUIStore.use.toggleShelf()
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
          icon="PushPin"
          onClick={() => setIsShelfPinned(true)}
          title="Pin shelf"
        />
      )}

      <NavigationItem
        icon="Notebook"
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
        icon="Wheelchair"
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
