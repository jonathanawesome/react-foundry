---
"react-foundry": patch
---

Toolbar controls now have keyboard shortcuts, and a tooltip on each button naming the control and its key. <kbd>S</kbd> and <kbd>P</kbd> toggle the shelf and the controls panel, <kbd>T</kbd> flips the theme, <kbd>A</kbd> toggles the accessibility check.

They are bare letters with no modifier, since the obvious chords are already taken by browsers. To stay out of your component's way, a keystroke is ignored when it lands on an input, a textarea, a select or a rich text editor on the canvas, when ctrl, cmd or alt is held, or when something closer to the keystroke has already handled it. The shortcut is announced to a screen reader as a description on the button, so it is discoverable without seeing the key cap.
