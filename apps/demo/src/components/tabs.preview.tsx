import { Tabs } from '@base-ui/react/tabs'
import { createPreview, type NavPath } from '@react-foundry/core'
import { useState } from 'react'

import { layout, tabs } from './base-ui.css'

export const nav: NavPath = 'Components/Disclosure/Tabs'

export const Default = createPreview(() => (
  <Tabs.Root className={tabs.root} defaultValue="overview">
    <Tabs.List className={tabs.list}>
      <Tabs.Tab className={tabs.tab} value="overview">
        Overview
      </Tabs.Tab>
      <Tabs.Tab className={tabs.tab} value="usage">
        Usage
      </Tabs.Tab>
      <Tabs.Tab className={tabs.tab} value="api">
        API
      </Tabs.Tab>
      <Tabs.Indicator className={tabs.indicator} />
    </Tabs.List>
    <Tabs.Panel className={tabs.panel} value="overview">
      A preview is a React component that fills the canvas.
    </Tabs.Panel>
    <Tabs.Panel className={tabs.panel} value="usage">
      Wrap each one in createPreview and give the file a nav path.
    </Tabs.Panel>
    <Tabs.Panel className={tabs.panel} value="api">
      createPreview accepts a render function or an options object.
    </Tabs.Panel>
  </Tabs.Root>
))

export const SecondSelected = createPreview({
  label: 'Opens on Usage',
  render: () => (
    <Tabs.Root className={tabs.root} defaultValue="usage">
      <Tabs.List className={tabs.list}>
        <Tabs.Tab className={tabs.tab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={tabs.tab} value="usage">
          Usage
        </Tabs.Tab>
        <Tabs.Indicator className={tabs.indicator} />
      </Tabs.List>
      <Tabs.Panel className={tabs.panel} value="overview">
        First panel.
      </Tabs.Panel>
      <Tabs.Panel className={tabs.panel} value="usage">
        Second panel, selected on mount.
      </Tabs.Panel>
    </Tabs.Root>
  ),
})

export const Controlled = createPreview({
  label: 'Reports the Active Tab',
  render: () => {
    const [value, setValue] = useState('overview')

    return (
      <div className={layout.stack}>
        <Tabs.Root
          className={tabs.root}
          value={value}
          onValueChange={(next) => setValue(next as string)}
        >
          <Tabs.List className={tabs.list}>
            <Tabs.Tab className={tabs.tab} value="overview">
              Overview
            </Tabs.Tab>
            <Tabs.Tab className={tabs.tab} value="usage">
              Usage
            </Tabs.Tab>
            <Tabs.Indicator className={tabs.indicator} />
          </Tabs.List>
          <Tabs.Panel className={tabs.panel} value="overview">
            First panel.
          </Tabs.Panel>
          <Tabs.Panel className={tabs.panel} value="usage">
            Second panel.
          </Tabs.Panel>
        </Tabs.Root>

        <p className={layout.hint}>Active tab: {value}</p>
      </div>
    )
  },
})
