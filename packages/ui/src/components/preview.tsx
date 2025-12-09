import { useRef } from 'react'

import type { ComponentPreview } from '@react-foundry/core'

import { useUIStore } from '../state'

import { AccessibilityChecker } from './accessibility-checker'
import { previewStyles } from './preview.css'

interface PreviewProps {
  preview: ComponentPreview | null
  selectedItem: string | null
  selectedType: 'variant' | 'demo' | null
}

export function Preview({ preview, selectedItem, selectedType }: PreviewProps) {
  const previewPaneRef = useRef<HTMLDivElement>(null)

  const { isAccessibilityEnabled, isShelfOpen } = useUIStore()

  if (!preview) {
    return (
      <div className={previewStyles.previewContainer}>
        <div className={previewStyles.noSelection}>
          Select a component from the sidebar to preview
        </div>
        <AccessibilityChecker
          targetRef={previewPaneRef}
          isEnabled={isAccessibilityEnabled}
          isShelfOpen={isShelfOpen}
        />
      </div>
    )
  }

  // If no selection, prompt user to select something
  if (!selectedItem || !selectedType) {
    return (
      <div className={previewStyles.previewContainer}>
        <div className={previewStyles.noSelection}>
          Select a variant or demo to preview
        </div>
        <AccessibilityChecker
          targetRef={previewPaneRef}
          isEnabled={isAccessibilityEnabled}
          isShelfOpen={isShelfOpen}
        />
      </div>
    )
  }

  // Render based on selection type
  if (selectedType === 'demo' && preview.demos) {
    const currentDemo = preview.demos.find(d => d.name === selectedItem)
    if (currentDemo) {
      // Wrap render function as a component to properly handle hooks
      const DemoComponent = currentDemo.render
      return (
        <div className={previewStyles.previewContainer}>
          <div className={previewStyles.previewPane} ref={previewPaneRef}>
            <DemoComponent />
          </div>
          <AccessibilityChecker
            targetRef={previewPaneRef}
            isEnabled={isAccessibilityEnabled}
            isShelfOpen={isShelfOpen}
          />
        </div>
      )
    }
  } else if (selectedType === 'variant' && preview.variants) {
    const currentVariant = preview.variants.find(v => v.name === selectedItem)
    if (currentVariant) {
      const Component = preview.component
      return (
        <div className={previewStyles.previewContainer}>
          <div className={previewStyles.previewPane} ref={previewPaneRef}>
            <Component {...currentVariant.props} />
          </div>
          <AccessibilityChecker
            targetRef={previewPaneRef}
            isEnabled={isAccessibilityEnabled}
            isShelfOpen={isShelfOpen}
          />
        </div>
      )
    }
  }

  // Fallback if nothing found
  return (
    <div className={previewStyles.previewContainer}>
      <div className={previewStyles.noSelection}>Preview not found</div>
      <AccessibilityChecker
        targetRef={previewPaneRef}
        isEnabled={isAccessibilityEnabled}
        isShelfOpen={isShelfOpen}
      />
    </div>
  )
}
