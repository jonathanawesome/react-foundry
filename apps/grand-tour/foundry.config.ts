import { defineConfig } from 'react-foundry'

// Two pro-cycling kits, one per mode, to show the theme prop reskinning the whole shell.
// Light is Lidl-Trek (blue panels, red canvas, yellow text); dark is Visma-Lease a Bike
// (black panels, yellow canvas, red text). Loud on purpose: it is a theme demo, not a
// usable palette.
export default defineConfig({
  previews: 'src/**/*.preview.tsx',
  port: 5174,
  title: 'Grand Tour',
  theme: {
    colors: {
      // Straight off the Lidl-Trek jersey: blue panels, red canvas, yellow text.
      light: {
        bg: '#ffffff', // white paper the preview card sits on
        fg: '#fff200', // Lidl yellow ink
        accent: '#fff200', // Lidl yellow highlights
        canvas: '#ee1c25', // Lidl red backdrop
        panel: '#015aa2', // Lidl blue shelf, toolbar, props panel
        textMuted: '#ffe680',
        textBody: '#fff200',
        textStrong: '#fff200',
      },
      // Visma-Lease a Bike: yellow canvas, black panels, red text.
      dark: {
        bg: '#0a0a0a', // black base
        fg: '#ee1c25', // red ink
        accent: '#ee1c25', // red highlights
        canvas: '#ffe500', // Visma yellow backdrop
        panel: '#0a0a0a', // black shelf, toolbar, props panel
        textMuted: '#ee1c25',
        textBody: '#ee1c25',
        textStrong: '#ee1c25',
      },
    },
  },
  nav: [
    {
      label: 'Components',
      children: [{ label: 'Badges' }, { label: 'Buttons' }, { label: 'Icons' }],
    },
  ],
})
