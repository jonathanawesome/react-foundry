import { defineConfig } from 'react-foundry'

export default defineConfig({
  previews: 'src/**/*.preview.tsx',
  port: 5173,
  title: 'Demo Components',
  nav: [
    // Foundry previewing its own presentational primitives.
    {
      label: 'Dogfood',
      children: [
        { label: 'Badge' },
        { label: 'Control Field' },
        { label: 'Icon' },
        { label: 'Icon Button' },
        { label: 'Providers' },
        { label: 'Render True' },
      ],
    },
    // Example components built on Base UI, showing the authoring surface.
    {
      label: 'Demo',
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
