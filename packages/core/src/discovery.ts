import type { DiscoveredComponent, PreviewModule } from './types'

export function createDiscovery(
  previewModules: Record<string, PreviewModule>
) {
  return function discoverComponents(): DiscoveredComponent[] {
    const components: DiscoveredComponent[] = []

    for (const [path, previewModule] of Object.entries(previewModules)) {
      const pathParts = path.split('/')
      const fileName = pathParts[pathParts.length - 1].replace(
        '.preview.tsx',
        ''
      )

      components.push({
        id: fileName,
        path,
        title: previewModule.default.title,
        component: previewModule.default.component,
        category: previewModule.default.category || 'Components',
        variants: previewModule.default.variants,
        demos: previewModule.default.demos,
        name: previewModule.default.title || fileName,
      })
    }

    return components.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })
  }
}
