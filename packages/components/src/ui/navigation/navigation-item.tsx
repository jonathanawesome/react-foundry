import { Icon, type IconName } from '../icon/icon'
import { navigationStyles } from './navigation.css'

type NavigationItemProps = {
  icon: IconName
  onClick: () => void
  title: string
}

export const NavigationItem = ({
  icon,
  onClick,
  title,
}: NavigationItemProps) => {
  return (
    <button className={navigationStyles.item} onClick={onClick} title={title}>
      <Icon name={icon} />
    </button>
  )
}
