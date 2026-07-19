import { defineConfig } from '@react-foundry/cli'

export default defineConfig({
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  title: 'Demo Components',
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
    { label: 'Another Top Level Item -- currently not in use' },
  ],
})
