import type { ReactNode } from 'react'

import { useUIStore } from '../state'
import * as styles from './layout.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const isShelfPinned = useUIStore.use.isShelfPinned()

  return (
    <div className={styles.layout} data-shelf-pinned={isShelfPinned}>
      {children}
    </div>
  )
}
