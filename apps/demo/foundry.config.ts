import { defineConfig } from '@react-foundry/cli'

export default defineConfig({
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  title: 'Demo Components',

  // Declaration order is display order. Every path here becomes part of the
  // NavPath union that preview files check their `nav` export against.
  nav: [
    {
      label: 'UI Components',
      children: [{ label: 'Card' }, { label: 'Button' }],
    },
  ],
})
