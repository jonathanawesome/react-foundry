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
  /**
   * Whether to render the browser's own tooltip. Turn it off when the button is
   * wrapped in a {@link Tooltip}, or the two stack up on hover.
   */
  nativeTooltip?: boolean
  /** Composes after the base style, for layout the caller owns. */
  className?: string
  /**
   * Hover and focus, for a caller that previews what the click would do while
   * the pointer or focus rests on the button.
   */
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  /** The id of an element describing the button, as {@link Tooltip} supplies one. */
  'aria-describedby'?: string
}

/**
 * A flat, square icon button with hover and active states.
 *
 * Every prop is named: nothing passes through to the `<button>` unseen, so the
 * component's surface is what it lists and a caller cannot reach past it. A
 * passed `className` composes after the base, the same way Scrollable and Badge
 * do it.
 */
export function IconButton({
  icon,
  onClick,
  title,
  active,
  className,
  nativeTooltip = true,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  'aria-describedby': describedBy,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={className ? `${iconButtonStyles} ${className}` : iconButtonStyles}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      title={nativeTooltip ? title : undefined}
      aria-label={title}
      aria-describedby={describedBy}
      aria-pressed={active}
      data-active={active}
    >
      <Icon name={icon} size="md" />
    </button>
  )
}
