import type { ButtonHTMLAttributes } from 'react'

import type { IconName } from './icon/icon'
import { Icon } from './icon/icon'
import { iconButtonStyles } from './icon-button.css'

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'onClick'> {
  icon: IconName
  onClick: () => void
  /** Tooltip and accessible name. */
  title: string
  /** Fills the button to show a toggle is on. */
  active?: boolean
  /**
   * Whether to render the browser's own tooltip. Turn it off when the button is
   * wrapped in a {@link Tooltip}, or the two stack up on hover.
   */
  nativeTooltip?: boolean
}

/**
 * A flat, square icon button with hover and active states.
 *
 * Extends the native button props so a caller can add pointer and focus handlers without
 * this component growing a prop per event. A passed `className` composes after the base,
 * the same way Scrollable and Badge do it.
 */
export function IconButton({
  icon,
  onClick,
  title,
  active,
  className,
  nativeTooltip = true,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={className ? `${iconButtonStyles} ${className}` : iconButtonStyles}
      onClick={onClick}
      title={nativeTooltip ? title : undefined}
      aria-label={title}
      aria-pressed={active}
      data-active={active}
      {...rest}
    >
      <Icon name={icon} size="md" />
    </button>
  )
}
