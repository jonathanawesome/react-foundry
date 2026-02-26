import type { ReactNode } from 'react'

import { cardStyles } from './card.css'

export interface CardProps {
  children: ReactNode
  padding?: 'small' | 'medium' | 'large'
  elevated?: boolean
}

export const Card = ({ children, padding = 'medium', elevated = false }: CardProps) => {
  return <div className={cardStyles({ padding, elevated })}>{children}</div>
}
