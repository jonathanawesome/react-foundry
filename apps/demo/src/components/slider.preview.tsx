import { Slider } from '@base-ui/react/slider'
import { useState } from 'react'
import { createPreview, type NavPath } from 'react-foundry'

import { layout, slider } from './base-ui.css'

export const nav: NavPath = 'Demo/Inputs/Slider'

// Controlled from the panel: a range drives the default value, a number the step,
// and a boolean the disabled state.
export const Playground = createPreview({
  controls: {
    value: { type: 'range', default: 40, min: 0, max: 100, step: 1 },
    step: { type: 'number', default: 1, min: 1, max: 25 },
    disabled: { type: 'boolean', default: false },
  },
  render: (v) => (
    <Slider.Root
      className={slider.root}
      // `key` remounts the slider when the controlled default changes.
      key={v.value}
      defaultValue={v.value}
      step={v.step}
      disabled={v.disabled}
    >
      <div className={slider.header}>
        <Slider.Label>Volume</Slider.Label>
        <Slider.Value />
      </div>
      <Slider.Control className={slider.control}>
        <Slider.Track className={slider.track}>
          <Slider.Indicator className={slider.indicator} />
          <Slider.Thumb className={slider.thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
})

export const Default = createPreview(() => (
  <Slider.Root className={slider.root} defaultValue={40}>
    <div className={slider.header}>
      <Slider.Label>Volume</Slider.Label>
      <Slider.Value />
    </div>
    <Slider.Control className={slider.control}>
      <Slider.Track className={slider.track}>
        <Slider.Indicator className={slider.indicator} />
        <Slider.Thumb className={slider.thumb} />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
))

export const Stepped = createPreview(() => (
  <Slider.Root className={slider.root} defaultValue={50} step={25}>
    <div className={slider.header}>
      <Slider.Label>Quality</Slider.Label>
      <Slider.Value />
    </div>
    <Slider.Control className={slider.control}>
      <Slider.Track className={slider.track}>
        <Slider.Indicator className={slider.indicator} />
        <Slider.Thumb className={slider.thumb} />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
))

export const Range = createPreview(() => (
  <Slider.Root className={slider.root} defaultValue={[25, 75]}>
    <div className={slider.header}>
      <Slider.Label>Price range</Slider.Label>
      <Slider.Value />
    </div>
    <Slider.Control className={slider.control}>
      <Slider.Track className={slider.track}>
        <Slider.Indicator className={slider.indicator} />
        <Slider.Thumb className={slider.thumb} />
        <Slider.Thumb className={slider.thumb} />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
))

export const Disabled = createPreview(() => (
  <Slider.Root className={slider.root} defaultValue={40} disabled>
    <div className={slider.header}>
      <Slider.Label>Volume</Slider.Label>
      <Slider.Value />
    </div>
    <Slider.Control className={slider.control}>
      <Slider.Track className={slider.track}>
        <Slider.Indicator className={slider.indicator} />
        <Slider.Thumb className={slider.thumb} />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
))

export const DrivesOtherState = createPreview({
  label: 'Feeds a Live Readout',
  render: () => {
    const [size, setSize] = useState(24)

    return (
      <div className={layout.stack}>
        <Slider.Root
          className={slider.root}
          value={size}
          onValueChange={(value) => setSize(value as number)}
          min={12}
          max={64}
        >
          <div className={slider.header}>
            <Slider.Label>Font size</Slider.Label>
            <Slider.Value />
          </div>
          <Slider.Control className={slider.control}>
            <Slider.Track className={slider.track}>
              <Slider.Indicator className={slider.indicator} />
              <Slider.Thumb className={slider.thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <p style={{ fontSize: `${size}px`, margin: 0 }}>Preview text</p>
      </div>
    )
  },
})
