import { defineConfig } from 'react-foundry'

// The counterpart to grand-tour: instead of pinning every token, this sets ONLY the
// three anchors (bg, fg, accent) with warmer shades and lets foundry recompute the whole
// derived ramp, canvas, panel, border, and the text tiers, in the browser. Two or three
// warm values and the entire shell warms up.
export default defineConfig({
  previews: 'src/**/*.preview.tsx',
  port: 5175,
  title: 'Warm',
  theme: {
    colors: {
      light: {
        bg: '#f7f1e8', // warm ivory paper
        fg: '#3a2e22', // warm brown ink
        accent: '#c2611f', // terracotta
      },
      dark: {
        bg: '#1c1712', // warm charcoal
        fg: '#f2e7d8', // warm cream ink
        accent: '#e08a3c', // amber
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
