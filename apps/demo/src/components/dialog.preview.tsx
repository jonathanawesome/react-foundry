import { Dialog } from '@base-ui/react/dialog'
import { useState } from 'react'
import { createPreview, type NavPath } from 'react-foundry'
import { dialog, layout } from './base-ui.css'
import { Button } from './button'

export const nav: NavPath = 'Demo/Overlays/Dialog'

export const Default = createPreview(() => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button>Open dialog</Button>} />
    <Dialog.Portal>
      <Dialog.Backdrop className={dialog.backdrop} />
      <Dialog.Popup className={dialog.popup}>
        <Dialog.Title className={dialog.title}>Publish this release?</Dialog.Title>
        <Dialog.Description className={dialog.description}>
          This makes the release visible to everyone with access to the project.
        </Dialog.Description>
        <div className={dialog.actions}>
          <Dialog.Close render={<Button variant="secondary">Cancel</Button>} />
          <Dialog.Close render={<Button>Publish</Button>} />
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
))

export const Destructive = createPreview(() => (
  <Dialog.Root>
    <Dialog.Trigger render={<Button variant="danger">Delete project</Button>} />
    <Dialog.Portal>
      <Dialog.Backdrop className={dialog.backdrop} />
      <Dialog.Popup className={dialog.popup}>
        <Dialog.Title className={dialog.title}>Delete this project?</Dialog.Title>
        <Dialog.Description className={dialog.description}>
          This cannot be undone. Everything in the project is removed permanently.
        </Dialog.Description>
        <div className={dialog.actions}>
          <Dialog.Close render={<Button variant="secondary">Keep it</Button>} />
          <Dialog.Close render={<Button variant="danger">Delete</Button>} />
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
))

export const Controlled = createPreview({
  label: 'Driven by Outside State',
  render: () => {
    const [open, setOpen] = useState(false)
    const [confirmations, setConfirmations] = useState(0)

    return (
      <div className={layout.stack}>
        <div className={layout.row}>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <span className={layout.hint}>Confirmed {confirmations} time(s)</span>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className={dialog.backdrop} />
            <Dialog.Popup className={dialog.popup}>
              <Dialog.Title className={dialog.title}>Confirm action</Dialog.Title>
              <Dialog.Description className={dialog.description}>
                Open state lives outside the dialog, so the counter below keeps working
                across opens.
              </Dialog.Description>
              <div className={dialog.actions}>
                <Dialog.Close render={<Button variant="secondary">Cancel</Button>} />
                <Button
                  onClick={() => {
                    setConfirmations((n) => n + 1)
                    setOpen(false)
                  }}
                >
                  Confirm
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    )
  },
})
