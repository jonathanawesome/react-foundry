import { useEffect, useRef } from 'react'

/**
 * Single-key shortcuts for the toolbar's controls.
 *
 * One map rather than a letter written at the listener and again at the
 * tooltip, so the hint a user reads is by construction the key that fires.
 */
export const TOOLBAR_SHORTCUTS = {
  shelf: 's',
  panel: 'p',
  theme: 't',
  accessibility: 'a',
} as const

export type ToolbarShortcut = keyof typeof TOOLBAR_SHORTCUTS

type ShortcutHandlers = Record<ToolbarShortcut, () => void>

const KEY_TO_SHORTCUT = new Map<string, ToolbarShortcut>(
  Object.entries(TOOLBAR_SHORTCUTS).map(([name, key]) => [key, name as ToolbarShortcut])
)

// `isContentEditable` is the direct question, but jsdom does not implement it,
// which would leave this guard untested. Walking the attribute asks the same
// thing, and covers a cursor sitting in a child of the editable host.
const EDITABLE_HOST =
  '[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]'

/**
 * Whether the keystroke landed somewhere that a bare `s` means "type an s"
 * rather than "toggle the shelf".
 *
 * The canvas renders the consumer's own component, form controls and all, so
 * foundry's chrome must never swallow a keystroke that was aimed at it.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest(EDITABLE_HOST)) return true

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Binds the toolbar's single-key shortcuts for as long as the toolbar is mounted.
 *
 * Bare letters rather than chords: the toolbar is a development tool a user
 * reaches for constantly, and the obvious chords are already claimed by browsers
 * (ctrl+shift+t reopens a tab, ctrl+shift+p opens a private window). The cost is
 * that the guards below have to be right.
 */
export function useToolbarShortcuts(handlers: ShortcutHandlers) {
  // The handlers close over toolbar state, so they are new on every toggle.
  // Reading them from a ref keeps one listener for the toolbar's whole life
  // instead of tearing down and rebinding on each keystroke's own re-render.
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // A modifier means the user is reaching for a browser or OS command, not
      // for us. Shift is not in the list: it only changes the letter's case,
      // which `toLowerCase` below has already undone.
      if (event.metaKey || event.ctrlKey || event.altKey) return

      // Something closer to the keystroke, a preview's own handler or a dialog,
      // has already claimed it.
      if (event.defaultPrevented) return

      if (event.repeat) return
      if (isTypingTarget(event.target)) return

      const shortcut = KEY_TO_SHORTCUT.get(event.key.toLowerCase())
      if (!shortcut) return

      event.preventDefault()
      handlersRef.current[shortcut]()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
