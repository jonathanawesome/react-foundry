import type { IconName } from './icon/icon'
import { Icon } from './icon/icon'
import { iconButtonStyles } from './icon-button.css'

export interface IconButtonProps {
  icon: IconName
  onClick: () => void
  /** Tooltip and accessible name. */
  title: string
  /** Fills the button to show a toggle is on. */
  active?: boolean
}

/** A flat, square icon button with hover and active states. */
export function IconButton({ icon, onClick, title, active }: IconButtonProps) {
  return (
    <button
      type="button"
      className={iconButtonStyles}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      data-active={active}
    >
      <Icon name={icon} size="md" />
    </button>
  )
}
