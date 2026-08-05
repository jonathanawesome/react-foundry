import { defineConfig, defineNav, type NavPathsOf } from 'react-foundry'

// The counterpart to grand-tour: instead of pinning every token, this sets ONLY the
// three anchors (bg, fg, accent) with warmer shades and lets foundry recompute the whole
// derived ramp, canvas, panel, border, and the text tiers, in the browser. Two or three
// warm values and the entire shell warms up.
//
// This app dogfoods the codegen-free route to the nav path union, so it is the one place
// in the repo where `foundry-nav.gen.d.ts` is never written. `defineNav` keeps the labels
// literal, `NavPathsOf` flattens them, and the previews import `WarmNavPath` by name
// instead of the ambient `NavPath`. The other demos keep the generated file, so both
// paths stay exercised.
const nav = defineNav([
  {
    label: 'Components',
    children: [{ label: 'Badges' }, { label: 'Buttons' }, { label: 'Icons' }],
  },
])

const config = defineConfig({
  previews: 'src/**/*.preview.tsx',
  port: 5175,
  title: 'Warm',
  nav,
  navTypes: false,
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
})

export default config

/** `'Components' | 'Components/Badges' | 'Components/Buttons' | 'Components/Icons'` */
export type WarmNavPath = NavPathsOf<typeof config>
