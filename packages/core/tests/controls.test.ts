import { describe, expect, it } from 'vitest'

import {
  coerceControlValues,
  defaultValues,
  encodeControlValues,
  isControlDef,
} from '../src/controls'
import type { ControlSchema } from '../src/types'

const schema: ControlSchema = {
  label: { type: 'text', default: 'Go' },
  variant: { type: 'select', options: ['primary', 'danger'], default: 'primary' },
  size: { type: 'radio', options: ['sm', 'lg'], default: 'sm' },
  count: { type: 'number', default: 1, min: 0, max: 10 },
  volume: { type: 'range', default: 5, min: 0, max: 10 },
  disabled: { type: 'boolean', default: false },
  tint: { type: 'color', default: '#000000' },
}

/** A schema mixing flat controls with a group, as `controlsFor` types one. */
const grouped: ControlSchema = {
  title: { type: 'text', default: 'Requests' },
  variants: {
    onSurface: { type: 'radio', options: ['base', 'raised'], default: 'raised' },
    tone: { type: 'select', options: ['default', 'success'], default: 'default' },
  },
}

describe('isControlDef', () => {
  it('reads a control by its string type', () => {
    expect(isControlDef({ type: 'text' })).toBe(true)
  })

  it('reads a group of controls as not a control', () => {
    expect(isControlDef({ tone: { type: 'text' } })).toBe(false)
  })

  // The reason this tests the value rather than the key: a prop named `type` is a
  // legitimate member of an object prop, and `<button type>` is the obvious case.
  it('reads a group whose own member is named type as a group', () => {
    expect(isControlDef({ type: { type: 'text' } })).toBe(false)
  })
})

describe('defaultValues', () => {
  it('returns each control default', () => {
    expect(defaultValues(schema)).toEqual({
      label: 'Go',
      variant: 'primary',
      size: 'sm',
      count: 1,
      volume: 5,
      disabled: false,
      tint: '#000000',
    })
  })

  it('falls back to a per-type zero value when no default is declared', () => {
    expect(
      defaultValues({
        text: { type: 'text' },
        bool: { type: 'boolean' },
        num: { type: 'number', min: 3 },
        pick: { type: 'select', options: ['a', 'b'] },
      })
    ).toEqual({ text: '', bool: false, num: 3, pick: 'a' })
  })
})

describe('coerceControlValues', () => {
  it('returns defaults when nothing is provided', () => {
    expect(coerceControlValues(schema, {})).toEqual(defaultValues(schema))
  })

  it('coerces a numeric string to a number', () => {
    expect(coerceControlValues(schema, { count: '3' }).count).toBe(3)
  })

  it('accepts an already-parsed number', () => {
    expect(coerceControlValues(schema, { count: 3 }).count).toBe(3)
  })

  // The router JSON.parses search values, so a text control can arrive typed.
  it('stringifies a non-string value for a text control', () => {
    expect(coerceControlValues(schema, { label: 123 }).label).toBe('123')
    expect(coerceControlValues(schema, { label: true }).label).toBe('true')
  })

  it('parses boolean strings', () => {
    expect(coerceControlValues(schema, { disabled: 'true' }).disabled).toBe(true)
    expect(coerceControlValues(schema, { disabled: 'false' }).disabled).toBe(false)
  })

  it('accepts an already-parsed boolean', () => {
    expect(coerceControlValues(schema, { disabled: true }).disabled).toBe(true)
  })

  it('falls back to the default for a non-numeric number input', () => {
    expect(coerceControlValues(schema, { count: 'abc' }).count).toBe(1)
  })

  it('falls back to the default for a select value not in options', () => {
    expect(coerceControlValues(schema, { variant: 'chartreuse' }).variant).toBe('primary')
  })

  it('accepts a select value that is in options', () => {
    expect(coerceControlValues(schema, { variant: 'danger' }).variant).toBe('danger')
  })

  it('ignores params not in the schema', () => {
    const result = coerceControlValues(schema, { bogus: 'x' }) as Record<string, unknown>
    expect(result.bogus).toBeUndefined()
  })

  // `??` not `||`: a real 0 / false / '' must survive rather than snap to default.
  it('keeps a legitimate zero', () => {
    expect(coerceControlValues(schema, { count: 0 }).count).toBe(0)
  })

  it('keeps a legitimate false', () => {
    expect(coerceControlValues(schema, { disabled: false }).disabled).toBe(false)
  })

  it('keeps a legitimate empty string', () => {
    expect(coerceControlValues(schema, { label: '' }).label).toBe('')
  })
})

describe('encodeControlValues', () => {
  it('omits values equal to the default', () => {
    expect(encodeControlValues(schema, defaultValues(schema))).toEqual({})
  })

  it('encodes only the values that differ from the default', () => {
    const values = { ...defaultValues(schema), variant: 'danger', count: 3 }

    expect(encodeControlValues(schema, values)).toEqual({ variant: 'danger', count: '3' })
  })

  it('encodes a falsy non-default value', () => {
    const values = { ...defaultValues(schema), count: 0 }

    expect(encodeControlValues(schema, values)).toEqual({ count: '0' })
  })

  // The whole point of the URL round-trip: what you encode coerces back intact.
  it('round-trips through coerce', () => {
    const values = {
      ...defaultValues(schema),
      variant: 'danger',
      count: 7,
      disabled: true,
      label: 'Hello',
    }
    const encoded = encodeControlValues(schema, values)

    expect(coerceControlValues(schema, encoded)).toEqual(values)
  })
})

// A group's values nest, mirroring the object prop they drive, but flatten for the
// URL so one edited member costs one short param.
describe('control groups', () => {
  it('nests a group default under its own key', () => {
    expect(defaultValues(grouped)).toEqual({
      title: 'Requests',
      variants: { onSurface: 'raised', tone: 'default' },
    })
  })

  it('falls back to a zero value per member when none is declared', () => {
    expect(
      defaultValues({ variants: { tone: { type: 'select', options: ['a', 'b'] } } })
    ).toEqual({ variants: { tone: 'a' } })
  })

  it('reads a member from its flattened param', () => {
    expect(coerceControlValues(grouped, { 'variants.tone': 'success' })).toEqual({
      title: 'Requests',
      variants: { onSurface: 'raised', tone: 'success' },
    })
  })

  it('falls back to the member default for a value outside its options', () => {
    const values = coerceControlValues(grouped, { 'variants.tone': 'chartreuse' })

    expect((values.variants as Record<string, unknown>).tone).toBe('default')
  })

  it('ignores a param naming the group itself rather than a member', () => {
    expect(coerceControlValues(grouped, { variants: 'raised' })).toEqual(
      defaultValues(grouped)
    )
  })

  it('encodes only the members that differ from their default', () => {
    const values = { title: 'Requests', variants: { onSurface: 'base', tone: 'default' } }

    expect(encodeControlValues(grouped, values)).toEqual({ 'variants.onSurface': 'base' })
  })

  it('encodes nothing for a group left at its defaults', () => {
    expect(encodeControlValues(grouped, defaultValues(grouped))).toEqual({})
  })

  // A schema can outrun the URL it is read back from: an old link, or a group added
  // to a preview since. Missing members take their defaults rather than throwing.
  it('tolerates values missing the group entirely', () => {
    expect(encodeControlValues(grouped, { title: 'Requests' })).toEqual({})
  })

  it('round-trips a group through encode and coerce', () => {
    const values = {
      title: 'Total requests',
      variants: { onSurface: 'base', tone: 'success' },
    }

    expect(coerceControlValues(grouped, encodeControlValues(grouped, values))).toEqual(
      values
    )
  })
})
