import type { ReactNode } from 'react'

import { buttonStyles } from './button.css'

export interface ButtonProps {
  /** The button's content: a label, or a label with an icon beside it. */
  children: ReactNode
  /**
   * The look. `primary` for the one action a screen is about, `secondary` for the
   * ones beside it, `danger` for one that destroys something.
   */
  variant?: 'primary' | 'secondary' | 'danger'
  /** The size, which sets the padding and the type size together. */
  size?: 'small' | 'medium' | 'large'
  /** Greys the button out and ignores clicks. */
  disabled?: boolean
  /** Called when the button is pressed. */
  onClick?: () => void
}

/**
 * Every prop is named and nothing passes through to the `<button>`, so the
 * component's surface is what it lists. That also means it cannot stand in for a
 * Base UI trigger: `render={<Button />}` would hand it the trigger's ref, `id`,
 * `aria-*` and `data-*` wiring, and a button that forwards none of it opens the
 * popup (the click survives) while staying invisible to the library. A trigger
 * that should look like this button takes the `buttonStyles` class instead.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled,
  onClick,
}: ButtonProps) => (
  <button
    type="button"
    className={buttonStyles({ variant, size })}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
)
