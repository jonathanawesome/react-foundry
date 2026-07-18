import type { DiscoveredComponent } from '@react-foundry/core'
import { Link } from '@tanstack/react-router'

import { componentLandingStyles as styles } from './component-landing.css'

interface ComponentLandingProps {
  preview: DiscoveredComponent | null
  componentId: string
}

export const ComponentLanding = ({ preview, componentId }: ComponentLandingProps) => {
  if (!preview) {
    return (
      <div className={styles.notFound}>
        <h1>Component not found</h1>
        <p>The component &quot;{componentId}&quot; could not be found.</p>
        <Link to="/">← Back to home</Link>
      </div>
    )
  }

  const hasVariants = preview.variants && preview.variants.length > 0
  const hasDemos = preview.demos && preview.demos.length > 0

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{preview.title}</h1>
      {preview.category && (
        <p className={styles.category}>Category: {preview.category}</p>
      )}
      <p className={styles.sourcePath}>{preview.path}</p>

      {!hasVariants && !hasDemos && (
        <p className={styles.emptyState}>
          No variants or demos available for this component.
        </p>
      )}

      {hasVariants && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Variants</h2>
          <ul className={styles.list}>
            {preview.variants?.map((variant) => (
              <li key={variant.name} className={styles.listItem}>
                <Link
                  to="/$componentId/variant/$variantName"
                  params={{ componentId, variantName: variant.name }}
                  className={styles.itemLink}
                >
                  {variant.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasDemos && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Demos</h2>
          <ul className={styles.list}>
            {preview.demos?.map((demo) => (
              <li key={demo.name} className={styles.listItem}>
                <Link
                  to="/$componentId/demo/$demoName"
                  params={{ componentId, demoName: demo.name }}
                  className={styles.itemLink}
                >
                  {demo.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
