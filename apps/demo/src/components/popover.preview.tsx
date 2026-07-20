import { Popover } from '@base-ui/react/popover'
import { createPreview, type NavPath } from '@react-foundry/core'
import { popover } from './base-ui.css'
import { Button } from './button'

export const nav: NavPath = 'Demo/Overlays/Popover'

export const Default = createPreview(() => (
  <Popover.Root>
    <Popover.Trigger render={<Button variant="secondary">What is this?</Button>} />
    <Popover.Portal>
      <Popover.Positioner sideOffset={8}>
        <Popover.Popup className={popover.popup}>
          <Popover.Title className={popover.title}>Release channel</Popover.Title>
          <Popover.Description>
            Stable receives updates roughly monthly. Beta receives them as they land.
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
))

export const AlignedToStart = createPreview({
  label: 'Aligned to Start',
  render: () => (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="secondary">Details</Button>} />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8}>
          <Popover.Popup className={popover.popup}>
            <Popover.Title className={popover.title}>Aligned to start</Popover.Title>
            <Popover.Description>
              The positioner controls side and alignment relative to the trigger.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
})

export const OnTheRight = createPreview(() => (
  <Popover.Root>
    <Popover.Trigger render={<Button variant="secondary">Open to the side</Button>} />
    <Popover.Portal>
      <Popover.Positioner side="right" sideOffset={8}>
        <Popover.Popup className={popover.popup}>
          <Popover.Title className={popover.title}>Side placement</Popover.Title>
          <Popover.Description>
            Flips automatically when there is not enough room.
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
))
