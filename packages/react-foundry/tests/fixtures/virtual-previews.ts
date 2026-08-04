import { createPreview, type PreviewFile } from '@react-foundry/core'

// Stands in for `virtual:react-foundry-previews`, the module the previews plugin emits
// from the consumer's glob. One file, one preview, declared at a nested nav path so the
// splat route has something arbitrarily deep to resolve.
const buttonModule = {
  Basic: createPreview({
    controls: { label: { type: 'text', default: 'Hi' } },
    render: () => null,
  }),
}

const previewModules: Record<string, PreviewFile> = {
  '/src/components/button.preview.tsx': {
    nav: 'Forms/Button',
    previews: [{ exportName: 'Basic', label: null }],
    load: async () => buttonModule,
  },
}

export default previewModules
