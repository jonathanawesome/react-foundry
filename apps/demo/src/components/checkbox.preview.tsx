import { Checkbox } from '@base-ui/react/checkbox'
import { createPreview, type NavPath } from '@react-foundry/core'
import { useState } from 'react'

import { checkbox, layout } from './base-ui.css'

export const nav: NavPath = 'Components/Inputs/Checkbox'

const Check = () => (
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
)

const Dash = () => (
  <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
    <title>Partially checked</title>
    <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const Unchecked = createPreview(() => (
  <div className={layout.row}>
    <Checkbox.Root className={checkbox.root} id="cb-unchecked">
      <Checkbox.Indicator className={checkbox.indicator}>
        <Check />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <label className={layout.label} htmlFor="cb-unchecked">
      Subscribe to updates
    </label>
  </div>
))

export const Checked = createPreview(() => (
  <div className={layout.row}>
    <Checkbox.Root className={checkbox.root} defaultChecked id="cb-checked">
      <Checkbox.Indicator className={checkbox.indicator}>
        <Check />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <label className={layout.label} htmlFor="cb-checked">
      Subscribe to updates
    </label>
  </div>
))

export const Disabled = createPreview(() => (
  <div className={layout.row}>
    <Checkbox.Root className={checkbox.root} defaultChecked disabled id="cb-disabled">
      <Checkbox.Indicator className={checkbox.indicator}>
        <Check />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <label className={layout.label} htmlFor="cb-disabled">
      Locked by your administrator
    </label>
  </div>
))

// A parent whose state derives from its children. A preview holding a hook is
// the same primitive as one that doesn't.
export const Indeterminate = createPreview({
  label: 'Parent and Children',
  render: () => {
    const [items, setItems] = useState([true, false, false])
    const allChecked = items.every(Boolean)
    const someChecked = items.some(Boolean) && !allChecked

    return (
      <div className={layout.stack}>
        <div className={layout.row}>
          <Checkbox.Root
            className={checkbox.root}
            checked={allChecked}
            indeterminate={someChecked}
            onCheckedChange={(checked) => setItems(items.map(() => checked))}
            id="cb-parent"
          >
            <Checkbox.Indicator className={checkbox.indicator}>
              {someChecked ? <Dash /> : <Check />}
            </Checkbox.Indicator>
          </Checkbox.Root>
          <label className={layout.label} htmlFor="cb-parent">
            Select all
          </label>
        </div>

        {items.map((checked, index) => (
          <div
            key={`option-${index}`}
            className={layout.row}
            style={{ marginLeft: '24px' }}
          >
            <Checkbox.Root
              className={checkbox.root}
              checked={checked}
              onCheckedChange={(next) =>
                setItems(items.map((v, i) => (i === index ? next : v)))
              }
              id={`cb-child-${index}`}
            >
              <Checkbox.Indicator className={checkbox.indicator}>
                <Check />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <label className={layout.label} htmlFor={`cb-child-${index}`}>
              Option {index + 1}
            </label>
          </div>
        ))}
      </div>
    )
  },
})
