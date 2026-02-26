import type { ReactNode } from 'react'

import { buttonStyles } from './button.css'

export interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  disabled?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={buttonStyles({ variant, size })}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
