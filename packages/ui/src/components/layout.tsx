import type { ReactNode } from 'react'

import { useUIStore } from '../state'
import * as styles from './layout.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const isShelfOpen = useUIStore.use.isShelfOpen()
  const isPanelOpen = useUIStore.use.isPanelOpen()

  return (
    <div
      className={styles.layout}
      data-shelf-open={isShelfOpen}
      data-panel-open={isPanelOpen}
    >
      {children}
    </div>
  )
}
