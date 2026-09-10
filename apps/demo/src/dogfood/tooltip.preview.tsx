import { IconButton, type IconName, Tooltip } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Tooltip'

interface ButtonProps {
  icon: IconName
  label: string
  shortcut?: string
}

/**
 * Mirrors how the toolbar pairs the two: one label, serving as both the
 * button's accessible name and the tooltip's text.
 *
 * `nativeTooltip` is off for the same reason it is there: the browser's own
 * tooltip would otherwise stack under this one on hover.
 */
const Button = ({ icon, label, shortcut }: ButtonProps) => (
  <Tooltip label={label} shortcut={shortcut}>
    <IconButton icon={icon} title={label} nativeTooltip={false} onClick={() => {}} />
  </Tooltip>
)

export const Default = createPreview(() => (
  <Button icon="Sliders" label="Toggle Controls Panel" shortcut="p" />
))

export const WithoutShortcut = createPreview({
  label: 'Without a Shortcut',
  render: () => <Button icon="Crosshair" label="Highlight in the preview" />,
})

export const Row = createPreview(() => (
  <div style={{ display: 'flex', gap: 8 }}>
    <Button icon="Notebook" label="Toggle Component List" shortcut="s" />
    <Button icon="Sliders" label="Toggle Controls Panel" shortcut="p" />
    <Button icon="Moon" label="Toggle Theme" shortcut="t" />
    <Button icon="Wheelchair" label="Enable Accessibility Check" shortcut="a" />
  </div>
))

// The two placements only a real window can show. Tests can check the
// arithmetic, but not whether the result actually reads on screen.
export const AgainstTheRightEdge = createPreview({
  label: 'Against the Right Edge',
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        icon="Sliders"
        label="Pulled back inside the window rather than centered"
        shortcut="x"
      />
    </div>
  ),
})

export const NearTheBottom = createPreview({
  label: 'Near the Bottom',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '80vh' }}>
      <Button
        icon="Sliders"
        label="Flipped above, with no room left below"
        shortcut="x"
      />
    </div>
  ),
})
