import { Checkbox } from '@base-ui/react/checkbox'
import { Slider } from '@base-ui/react/slider'
import { Switch } from '@base-ui/react/switch'
import { createPreview, type NavPath } from '@react-foundry/core'

import { checkbox, layout, slider, switchStyles } from './base-ui.css'

// Sits on `Components/Inputs`, which also has children: this group shows its own
// previews and nests Checkbox, Switch, and Slider beneath it.
export const nav: NavPath = 'Demo/Inputs'

export const AllInputs = createPreview({
  label: 'Everything Together',
  render: () => (
    <div className={layout.stack}>
      <div className={layout.row}>
        <Checkbox.Root className={checkbox.root} defaultChecked id="ov-checkbox">
          <Checkbox.Indicator className={checkbox.indicator}>
            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
              <title>Checked</title>
              <path
                d="M1.5 6.5L4.5 9.5L10.5 2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label className={layout.label} htmlFor="ov-checkbox">
          Checkbox
        </label>
      </div>

      <div className={layout.row}>
        <Switch.Root className={switchStyles.root} defaultChecked id="ov-switch">
          <Switch.Thumb className={switchStyles.thumb} />
        </Switch.Root>
        <label className={layout.label} htmlFor="ov-switch">
          Switch
        </label>
      </div>

      <Slider.Root className={slider.root} defaultValue={60}>
        <div className={slider.header}>
          <Slider.Label>Slider</Slider.Label>
          <Slider.Value />
        </div>
        <Slider.Control className={slider.control}>
          <Slider.Track className={slider.track}>
            <Slider.Indicator className={slider.indicator} />
            <Slider.Thumb className={slider.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
})

export const DisabledStates = createPreview({
  label: 'All Disabled',
  render: () => (
    <div className={layout.stack}>
      <div className={layout.row}>
        <Checkbox.Root className={checkbox.root} defaultChecked disabled id="ov-cb-off">
          <Checkbox.Indicator className={checkbox.indicator} />
        </Checkbox.Root>
        <label className={layout.label} htmlFor="ov-cb-off">
          Checkbox
        </label>
      </div>

      <div className={layout.row}>
        <Switch.Root className={switchStyles.root} defaultChecked disabled id="ov-sw-off">
          <Switch.Thumb className={switchStyles.thumb} />
        </Switch.Root>
        <label className={layout.label} htmlFor="ov-sw-off">
          Switch
        </label>
      </div>

      <Slider.Root className={slider.root} defaultValue={60} disabled>
        <div className={slider.header}>
          <Slider.Label>Slider</Slider.Label>
          <Slider.Value />
        </div>
        <Slider.Control className={slider.control}>
          <Slider.Track className={slider.track}>
            <Slider.Indicator className={slider.indicator} />
            <Slider.Thumb className={slider.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  ),
})
