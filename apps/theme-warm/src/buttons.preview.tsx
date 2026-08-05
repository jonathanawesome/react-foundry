import { IconButton } from '@react-foundry/ui'
import { createPreview, defineControls } from 'react-foundry'

import type { WarmNavPath } from '../foundry.config'

export const nav: WarmNavPath = 'Components/Buttons'

// A controlled preview drives the props panel, so its inputs and the active accent show
// the recomputed warm scale.
const controls = defineControls({
  icon: {
    type: 'select',
    options: ['Notebook', 'Sliders', 'Moon', 'Sun'],
    default: 'Notebook',
  },
  title: { type: 'text', default: 'Toolbar action' },
  active: { type: 'boolean', default: false },
})

export const Playground = createPreview({
  label: 'Playground',
  controls,
  render: (values) => (
    <IconButton
      icon={values.icon}
      title={values.title}
      active={values.active}
      onClick={() => {}}
    />
  ),
})

export const ToolbarRow = createPreview({
  label: 'Toolbar Row',
  render: () => (
    <div style={{ display: 'flex', gap: 4 }}>
      <IconButton icon="Notebook" title="Notebook" active onClick={() => {}} />
      <IconButton icon="Sliders" title="Sliders" onClick={() => {}} />
      <IconButton icon="Sun" title="Theme" onClick={() => {}} />
      <IconButton icon="Wheelchair" title="Accessibility" onClick={() => {}} />
    </div>
  ),
})
