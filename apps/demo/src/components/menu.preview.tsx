import { Menu } from '@base-ui/react/menu'
import { createPreview, type NavPath } from 'react-foundry'
import { menu } from './base-ui.css'
import { Button } from './button'

export const nav: NavPath = 'Demo/Overlays/Menu'

/**
 * Base UI's Menu portals its popup onto `document.body`, so the trigger renders inside
 * the canvas while the popup lands outside it, next to foundry's own chrome.
 *
 * The separators are the fixture. They are `<hr>`s whose line comes from the demo's CSS
 * and whose spacing comes from the UA's `margin-block: 0.5em`. Foundry's chrome reset was
 * once written as "everything that is not the canvas", which swept up portalled content
 * and zeroed that margin: the divider still drew its line, flush against the items on
 * either side, and read as missing. Leave them without an explicit margin, since the
 * point is that a portalled popup keeps the defaults it would get in a real app.
 */
export const Default = createPreview(() => (
  <Menu.Root>
    <Menu.Trigger render={<Button variant="secondary">Project actions</Button>} />
    <Menu.Portal>
      <Menu.Positioner sideOffset={8}>
        <Menu.Popup className={menu.popup}>
          <Menu.Group>
            <Menu.GroupLabel className={menu.groupLabel}>Edit</Menu.GroupLabel>
            <Menu.Item className={menu.item}>
              Rename<span className={menu.shortcut}>⌘R</span>
            </Menu.Item>
            <Menu.Item className={menu.item}>
              Duplicate<span className={menu.shortcut}>⌘D</span>
            </Menu.Item>
          </Menu.Group>

          <Menu.Separator render={<hr />} className={menu.separator} />

          <Menu.Group>
            <Menu.GroupLabel className={menu.groupLabel}>Share</Menu.GroupLabel>
            <Menu.Item className={menu.item}>Copy link</Menu.Item>
            <Menu.Item className={menu.item}>Invite people</Menu.Item>
          </Menu.Group>

          <Menu.Separator render={<hr />} className={menu.separator} />

          <Menu.Item className={menu.item}>Archive project</Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
))

/**
 * A submenu opens a second portal, one the first popup does not contain either.
 *
 * The offsets are Base UI's own: positive away from a trigger above or below, negative on
 * the inline sides so the submenu overlaps the parent popup's edge rather than leaving
 * open ground for the pointer to cross on its way in.
 */
const submenuOffset = ({ side }: { side: Menu.Positioner.Props['side'] }) =>
  side === 'top' || side === 'bottom' ? 4 : -4

export const WithSubmenu = createPreview({
  label: 'With a Submenu',
  render: () => (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary">Move this file</Button>} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup className={menu.popup}>
            <Menu.Item className={menu.item}>Open</Menu.Item>

            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={menu.item}>
                Move to<span className={menu.shortcut}>›</span>
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={submenuOffset} alignOffset={submenuOffset}>
                  <Menu.Popup className={menu.popup}>
                    <Menu.Item className={menu.item}>Drafts</Menu.Item>
                    <Menu.Item className={menu.item}>Published</Menu.Item>

                    <Menu.Separator render={<hr />} className={menu.separator} />

                    <Menu.Item className={menu.item}>New folder…</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.Separator render={<hr />} className={menu.separator} />

            <Menu.Item className={menu.item}>Delete</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
})
