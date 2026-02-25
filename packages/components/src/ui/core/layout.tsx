import { ReactNode } from 'react'

import * as styles from './layout.css'

interface LayoutProps {
  children: ReactNode
  isShelfPinned?: boolean
}

export function Layout({ children, isShelfPinned }: LayoutProps) {
  return (
    <div className={styles.layout} data-shelf-pinned={isShelfPinned}>
      {children}
    </div>
  )
}
