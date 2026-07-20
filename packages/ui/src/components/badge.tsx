import type { ReactNode } from 'react'

import { badgeStyles } from './badge.css'

export type BadgeTone = 'danger' | 'warning' | 'caution' | 'info' | 'success' | 'neutral'

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  /** Extra class, e.g. to position the badge within a row. */
  className?: string
}

/** A small status pill in one of a fixed set of tones. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  const classes = className
    ? `${badgeStyles({ tone })} ${className}`
    : badgeStyles({ tone })

  return <span className={classes}>{children}</span>
}
