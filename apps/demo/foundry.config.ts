import { defineConfig } from '@react-foundry/cli'

export default defineConfig({
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  title: 'Demo Components',

  // Declaration order is display order. Deliberately not alphabetical, so the
  // rendered shelf shows that the config wins rather than coincidentally
  // matching the fallback sort.
  //
  // `Inputs` is worth noticing: it has children *and* a preview file of its own
  // sitting directly on it, which the old category/component shape could not do.
  nav: [
    {
      label: 'Components',
      children: [
        {
          label: 'Inputs',
          children: [{ label: 'Checkbox' }, { label: 'Switch' }, { label: 'Slider' }],
        },
        { label: 'Actions' },
        { label: 'Surfaces' },
        {
          label: 'Overlays',
          children: [{ label: 'Dialog' }, { label: 'Popover' }],
        },
        {
          label: 'Disclosure',
          children: [{ label: 'Accordion' }, { label: 'Tabs' }],
        },
      ],
    },
  ],
})
