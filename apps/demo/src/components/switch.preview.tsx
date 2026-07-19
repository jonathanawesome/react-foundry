import { Switch } from '@base-ui/react/switch'
import { createPreview, type NavPath } from '@react-foundry/core'
import { useState } from 'react'

import { layout, switchStyles } from './base-ui.css'

export const nav: NavPath = 'Components/Inputs/Switch'

export const Off = createPreview(() => (
  <div className={layout.row}>
    <Switch.Root className={switchStyles.root} id="sw-off">
      <Switch.Thumb className={switchStyles.thumb} />
    </Switch.Root>
    <label className={layout.label} htmlFor="sw-off">
      Airplane mode
    </label>
  </div>
))

export const On = createPreview(() => (
  <div className={layout.row}>
    <Switch.Root className={switchStyles.root} defaultChecked id="sw-on">
      <Switch.Thumb className={switchStyles.thumb} />
    </Switch.Root>
    <label className={layout.label} htmlFor="sw-on">
      Airplane mode
    </label>
  </div>
))

export const Disabled = createPreview(() => (
  <div className={layout.row}>
    <Switch.Root className={switchStyles.root} defaultChecked disabled id="sw-disabled">
      <Switch.Thumb className={switchStyles.thumb} />
    </Switch.Root>
    <label className={layout.label} htmlFor="sw-disabled">
      Managed by policy
    </label>
  </div>
))

export const RevealsContent = createPreview({
  label: 'Toggles Extra Settings',
  render: () => {
    const [advanced, setAdvanced] = useState(false)

    return (
      <div className={layout.stack}>
        <div className={layout.row}>
          <Switch.Root
            className={switchStyles.root}
            checked={advanced}
            onCheckedChange={setAdvanced}
            id="sw-advanced"
          >
            <Switch.Thumb className={switchStyles.thumb} />
          </Switch.Root>
          <label className={layout.label} htmlFor="sw-advanced">
            Show advanced settings
          </label>
        </div>

        {advanced && (
          <p className={layout.hint}>
            Advanced settings are visible. Toggle again to hide them.
          </p>
        )}
      </div>
    )
  },
})
