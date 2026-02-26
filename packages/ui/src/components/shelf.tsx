import type { DiscoveredComponent } from '@react-foundry/core'
import { Link, useParams } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'

import { Icon } from '../icon/icon'
import { useUIStore } from '../state'

import { shelfStyles } from './shelf.css'

interface ShelfProps {
  components: DiscoveredComponent[]
}

// Custom hook for managing expanded state
function useExpandState(
  routeComponentId: string | null,
  routeVariantName: string | null,
  routeDemoName: string | null
) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Auto-expand sections based on current route
  useEffect(() => {
    if (routeComponentId) {
      setExpandedSections((prev) => {
        const newSet = new Set(prev)
        // Expand the component section
        newSet.add(`${routeComponentId}-component`)

        // Expand variants section if we're on a variant route
        if (routeVariantName) {
          newSet.add(`${routeComponentId}-variants`)
        }

        // Expand demos section if we're on a demo route
        if (routeDemoName) {
          newSet.add(`${routeComponentId}-demos`)
        }

        return newSet
      })
    }
  }, [routeComponentId, routeVariantName, routeDemoName])

  const toggleExpanded = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId)

  return { isExpanded, toggleExpanded }
}

// Reusable section header component
const SectionHeader = ({
  action,
  title,
  isExpanded,
}: {
  action: () => void
  title: string
  isExpanded: boolean
}) => (
  <button
    type="button"
    className={shelfStyles.sectionHeader}
    onClick={action}
    data-active={isExpanded}
  >
    <Icon name="Chevron" rotate={isExpanded ? '90' : undefined} size="small" />
    {title}
  </button>
)

// Generic collapsible section component
interface CollapsibleSectionProps {
  title: string
  sectionId: string
  componentId: string
  isExpanded: boolean
  toggleExpanded: (id: string) => void
  children: ReactNode
}

const CollapsibleSection = ({
  title,
  sectionId,
  componentId,
  isExpanded,
  toggleExpanded,
  children,
}: CollapsibleSectionProps) => (
  <div className={shelfStyles.section}>
    <SectionHeader
      action={() => toggleExpanded(sectionId)}
      isExpanded={isExpanded}
      title={title}
    />
    {isExpanded && (
      <ul
        className={shelfStyles.sectionList}
        id={`${title.toLowerCase()}-list-${componentId}`}
      >
        {children}
      </ul>
    )}
  </div>
)

// Section item link component
interface SectionItemProps {
  to: string
  params: Record<string, string>
  isActive: boolean
  name: string
}

const SectionItem = ({ to, params, isActive, name }: SectionItemProps) => (
  <li>
    <Link
      to={to}
      params={params}
      className={shelfStyles.itemButton}
      data-active={isActive}
    >
      {name}
    </Link>
  </li>
)

// Component item with sections
interface ComponentItemProps {
  component: DiscoveredComponent
  isComponentExpanded: boolean
  toggleExpanded: (id: string) => void
  isExpanded: (id: string) => boolean
  routeComponentId: string | null
  routeVariantName: string | null
  routeDemoName: string | null
}

const ComponentItem = ({
  component,
  isComponentExpanded,
  toggleExpanded,
  isExpanded,
  routeComponentId,
  routeVariantName,
  routeDemoName,
}: ComponentItemProps) => {
  const hasVariants = component.variants && component.variants.length > 0
  const hasDemos = component.demos && component.demos.length > 0

  const componentId = `${component.id}-component`
  const variantsSectionId = `${component.id}-variants`
  const demosSectionId = `${component.id}-demos`

  return (
    <li className={shelfStyles.componentItem}>
      <button
        type="button"
        className={shelfStyles.componentTitle}
        onClick={() => toggleExpanded(componentId)}
        data-expanded={isComponentExpanded}
      >
        {component.name}
      </button>

      {isComponentExpanded && hasVariants && (
        <CollapsibleSection
          title="Variants"
          sectionId={variantsSectionId}
          componentId={component.id}
          isExpanded={isExpanded(variantsSectionId)}
          toggleExpanded={toggleExpanded}
        >
          {component.variants?.map((variant) => (
            <SectionItem
              key={variant.name}
              to="/$componentId/variant/$variantName"
              params={{
                componentId: component.id,
                variantName: variant.name,
              }}
              isActive={
                routeComponentId === component.id && routeVariantName === variant.name
              }
              name={variant.name}
            />
          ))}
        </CollapsibleSection>
      )}

      {isComponentExpanded && hasDemos && (
        <CollapsibleSection
          title="Demos"
          sectionId={demosSectionId}
          componentId={component.id}
          isExpanded={isExpanded(demosSectionId)}
          toggleExpanded={toggleExpanded}
        >
          {component.demos?.map((demo) => (
            <SectionItem
              key={demo.name}
              to="/$componentId/demo/$demoName"
              params={{
                componentId: component.id,
                demoName: demo.name,
              }}
              isActive={routeComponentId === component.id && routeDemoName === demo.name}
              name={demo.name}
            />
          ))}
        </CollapsibleSection>
      )}
    </li>
  )
}

export const Shelf = ({ components }: ShelfProps) => {
  const { isShelfPinned, isShelfOpen } = useUIStore()

  const params = useParams({ strict: false })

  // Extract route params more cleanly
  const routeComponentId = 'componentId' in params ? (params.componentId as string) : null
  const routeVariantName = 'variantName' in params ? (params.variantName as string) : null
  const routeDemoName = 'demoName' in params ? (params.demoName as string) : null

  const { isExpanded, toggleExpanded } = useExpandState(
    routeComponentId,
    routeVariantName,
    routeDemoName
  )

  // Group components by category
  const grouped = components.reduce(
    (acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = []
      }
      acc[comp.category].push(comp)
      return acc
    },
    {} as Record<string, DiscoveredComponent[]>
  )

  return (
    <aside
      className={shelfStyles.shelf}
      data-open={isShelfOpen}
      data-pinned={isShelfPinned}
    >
      <div className={shelfStyles.content}>
        <aside className={shelfStyles.sidebar}>
          {Object.entries(grouped).map(([category, discoveredComponents]) => (
            <div key={category} className={shelfStyles.category}>
              <h2 className={shelfStyles.categoryTitle}>{category}</h2>
              <ul className={shelfStyles.componentList}>
                {discoveredComponents.map((component) => (
                  <ComponentItem
                    key={component.id}
                    component={component}
                    isComponentExpanded={isExpanded(`${component.id}-component`)}
                    toggleExpanded={toggleExpanded}
                    isExpanded={isExpanded}
                    routeComponentId={routeComponentId}
                    routeVariantName={routeVariantName}
                    routeDemoName={routeDemoName}
                  />
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </aside>
  )
}
