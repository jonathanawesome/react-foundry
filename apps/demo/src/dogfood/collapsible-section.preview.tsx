import { CollapsibleSection, ControlField, IconButton, Tooltip } from '@react-foundry/ui'
import { useState } from 'react'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Collapsible Section'

/**
 * A field with local state, so the sections have something live to fold away.
 * This is foundry previewing the props panel's own building blocks.
 */
function Field({ name, initial }: { name: string; initial: string }) {
  const [value, setValue] = useState<string | number | boolean>(initial)
  return (
    <ControlField name={name} def={{ type: 'text' }} value={value} onChange={setValue} />
  )
}

export const Default = createPreview(() => (
  <div style={{ width: 280 }}>
    <CollapsibleSection label="Variants">
      <Field name="tone" initial="success" />
      <Field name="onSurface" initial="raised" />
    </CollapsibleSection>
  </div>
))

// As the list control draws its rows: tight, nested, and each with an action of
// its own on the border line beside the caret.
export const Nested = createPreview({
  label: 'Nested with Actions',
  render: () => (
    <div style={{ width: 280 }}>
      <CollapsibleSection label="Sections">
        {['Row 1', 'Row 2'].map((row) => (
          <CollapsibleSection
            key={row}
            label={row}
            tight
            actions={
              <Tooltip label={`Remove ${row.toLowerCase()}`}>
                <IconButton
                  icon="X"
                  size="sm"
                  title={`Remove ${row.toLowerCase()}`}
                  nativeTooltip={false}
                  onClick={() => {}}
                />
              </Tooltip>
            }
          >
            <Field name="title" initial={`${row} title`} />
            <Field name="body" initial={`${row} body`} />
          </CollapsibleSection>
        ))}
      </CollapsibleSection>
    </div>
  ),
})
