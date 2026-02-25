import { createFileRoute, Link } from '@tanstack/react-router'

import { getComponentById } from '../utils/route-utils'

export const Route = createFileRoute('/$componentId/')({
  component: ComponentLanding,
  loader: ({ params }) => {
    return {
      preview: getComponentById(params.componentId),
    }
  },
})

function ComponentLanding() {
  const { preview } = Route.useLoaderData()
  const { componentId } = Route.useParams()

  if (!preview) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Component not found</h1>
        <p>The component &quot;{componentId}&quot; could not be found.</p>
        <Link to="/">← Back to home</Link>
      </div>
    )
  }

  const hasVariants = preview.variants && preview.variants.length > 0
  const hasDemos = preview.demos && preview.demos.length > 0

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>{preview.title}</h1>
      {preview.category && (
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Category: {preview.category}
        </p>
      )}

      {!hasVariants && !hasDemos && (
        <p style={{ color: '#999', fontStyle: 'italic' }}>
          No variants or demos available for this component.
        </p>
      )}

      {hasVariants && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Variants</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {preview.variants?.map((variant) => (
              <li key={variant.name} style={{ marginBottom: '0.5rem' }}>
                <Link
                  to="/$componentId/variant/$variantName"
                  params={{ componentId, variantName: variant.name }}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#333',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {variant.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasDemos && (
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Demos</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {preview.demos?.map((demo) => (
              <li key={demo.name} style={{ marginBottom: '0.5rem' }}>
                <Link
                  to="/$componentId/demo/$demoName"
                  params={{ componentId, demoName: demo.name }}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: '#333',
                    transition: 'background-color 0.2s',
                  }}
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
