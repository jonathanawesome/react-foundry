import type { ComponentProps } from 'react'

import { buttonStyles } from './button.css'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
}

/**
 * Every prop other than the two style ones passes through to the `<button>`, ref
 * included. Base UI's `render={<Button />}` merges its trigger wiring into the element it
 * is given (the ref it positions against, `id`, `aria-expanded`, `aria-haspopup`, the
 * `data-*` state attributes), so a component that only forwards the props it recognizes
 * silently drops all of it and keeps working just enough to be confusing: the menu still
 * opens, because `onClick` survives, while the trigger stays invisible to the library.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  className,
  ...rest
}: ButtonProps) => {
  const styles = buttonStyles({ variant, size })

  return (
    <button
      type="button"
      {...rest}
      className={className ? `${styles} ${className}` : styles}
    >
      {children}
    </button>
  )
}
