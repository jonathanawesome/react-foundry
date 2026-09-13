import type { ControlEntry, PropDoc } from '@react-foundry/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  describeControl,
  describeProp,
  PropInfo,
} from '../src/components/prop-info/prop-info'

describe('PropInfo', () => {
  const doc: PropDoc = {
    name: 'variant',
    type: "'primary' | 'danger'",
    optional: true,
    description: 'Which look the button takes.',
  }
  const entry: ControlEntry = { type: 'select', options: ['primary', 'danger'] }

  it('shows the prop as declared, with its description, on hover', async () => {
    render(<PropInfo name="variant" entry={entry} doc={doc} />)

    await userEvent.hover(screen.getByRole('button'))

    expect(screen.getByText("variant?: 'primary' | 'danger'")).toBeInTheDocument()
    expect(screen.getByText('Which look the button takes.')).toBeInTheDocument()
  })

  // The bubble is hidden from assistive tech, so the words go on the mark itself.
  it('names the mark with the same words the bubble shows', () => {
    render(<PropInfo name="variant" entry={entry} doc={doc} />)

    expect(
      screen.getByRole('button', {
        name: "variant?: 'primary' | 'danger'. Which look the button takes.",
      })
    ).toBeInTheDocument()
  })

  // The real prop name leads even when the control is labelled something else,
  // which is the point of showing it.
  it('leads with the prop name, not the label', () => {
    render(<PropInfo name="variant" entry={{ ...entry, label: 'Look' }} doc={doc} />)

    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/^variant\?: /)
  })

  it('falls back to the control definition when no doc is known', async () => {
    render(<PropInfo name="variant" entry={entry} />)

    await userEvent.hover(screen.getByRole('button'))

    expect(screen.getByText(`variant: select "primary" | "danger"`)).toBeInTheDocument()
  })
})

describe('describeProp', () => {
  it('marks an optional prop with a question mark', () => {
    expect(describeProp({ name: 'title', type: 'string', optional: true })).toBe(
      'title?: string'
    )
    expect(describeProp({ name: 'title', type: 'string', optional: false })).toBe(
      'title: string'
    )
  })
})

describe('describeControl', () => {
  it.each<[string, ControlEntry, string]>([
    ['a text control', { type: 'text' }, 'label: text'],
    ['a default', { type: 'text', default: 'Go' }, 'label: text = "Go"'],
    ['a boolean', { type: 'boolean', default: false }, 'label: boolean = false'],
    [
      'a select',
      { type: 'select', options: ['a', 'b'], default: 'a' },
      'label: select "a" | "b" = "a"',
    ],
    [
      'a range',
      { type: 'range', min: 1, max: 5, step: 2, default: 3 },
      'label: range 1…5 step 2 = 3',
    ],
    ['a number with one bound', { type: 'number', min: 0 }, 'label: number 0…'],
    [
      'a group',
      { tone: { type: 'text' }, on: { type: 'boolean' } },
      'label: { tone: text, on: boolean }',
    ],
    [
      'a list of a control',
      { type: 'list', of: { type: 'text' } },
      'label: list of text',
    ],
    [
      'a list of a group',
      { type: 'list', of: { title: { type: 'text' }, open: { type: 'boolean' } } },
      'label: list of { title: text, open: boolean }',
    ],
  ])('describes %s', (_, control, expected) => {
    expect(describeControl('label', control)).toBe(expected)
  })
})
