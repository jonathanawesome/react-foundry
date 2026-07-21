import type { NavNode } from '@react-foundry/core'
import { chromeSurface } from '@react-foundry/style'
import { Link } from '@tanstack/react-router'

import { componentLandingStyles as styles } from './component-landing.css'

interface ComponentLandingProps {
  node: NavNode | null
  path: string
}

/**
 * Landing view for a nav path that resolves to a group rather than a preview.
 *
 * Lists what sits under it, so a partial URL is a useful page instead of a
 * dead end.
 */
export const ComponentLanding = ({ node, path }: ComponentLandingProps) => {
  if (!node) {
    return (
      <div className={`${chromeSurface} ${styles.notFound}`}>
        <h1>Not found</h1>
        <p>Nothing is registered at &quot;{path}&quot;.</p>
        <Link to="/">← Back to home</Link>
      </div>
    )
  }

  const isEmpty = node.leaves.length === 0 && node.children.length === 0

  return (
    <div className={`${chromeSurface} ${styles.container}`}>
      <h1 className={styles.title}>{node.label}</h1>
      <p className={styles.sourcePath}>{node.path}</p>

      {isEmpty && <p className={styles.emptyState}>Nothing here yet.</p>}

      {node.leaves.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Previews</h2>
          <ul className={styles.list}>
            {node.leaves.map((leaf) => (
              <li key={leaf.id} className={styles.listItem}>
                <Link to="/$" params={{ _splat: leaf.id }} className={styles.itemLink}>
                  {leaf.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {node.children.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sections</h2>
          <ul className={styles.list}>
            {node.children.map((child) => (
              <li key={child.path} className={styles.listItem}>
                <Link to="/$" params={{ _splat: child.path }} className={styles.itemLink}>
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
