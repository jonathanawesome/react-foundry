import { describe, expect, it } from 'vitest'

import {
  coerceControlValues,
  defaultValues,
  deriveControlValues,
  encodeControlValues,
  isControlDef,
  isListControlDef,
  listRowDefault,
} from '../src/controls'
import type { ControlSchema, ListControlDef } from '../src/types'

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

  it('reads a list as not a control', () => {
    expect(isControlDef({ type: 'list', of: { type: 'text' } })).toBe(false)
  })
})

describe('isListControlDef', () => {
  it('reads a list by its type', () => {
    expect(isListControlDef({ type: 'list', of: { type: 'text' } })).toBe(true)
  })

  it('reads a control and a group as not a list', () => {
    expect(isListControlDef({ type: 'text' })).toBe(false)
    expect(isListControlDef({ tone: { type: 'text' } })).toBe(false)
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

    expect(encodeControlValues(schema, values)).toEqual({ variant: 'danger', count: 3 })
  })

  it('encodes a falsy non-default value', () => {
    const values = { ...defaultValues(schema), count: 0 }

    expect(encodeControlValues(schema, values)).toEqual({ count: 0 })
  })

  // Typed, not stringified: the router writes a number or boolean bare, but quotes a
  // string that would parse as one, which is what put `%223%22` in the address bar.
  it('keeps numbers and booleans as their own types', () => {
    const values = { ...defaultValues(schema), volume: 8, disabled: true }

    expect(encodeControlValues(schema, values)).toEqual({ volume: 8, disabled: true })
  })

  // A link written by the old encoder, or by hand, still resolves.
  it('coerces a stringified value the same as a typed one', () => {
    expect(coerceControlValues(schema, { count: '3', disabled: 'true' })).toEqual(
      coerceControlValues(schema, { count: 3, disabled: true })
    )
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

// `derive` maps a control's value to what the prop takes, after coercion and before
// render. The panel and the URL never see the derived value: they work on the raw
// one, which is what these schemas hold the derive alongside.
describe('deriveControlValues', () => {
  const CLIENTS = ['acme', 'globex', 'initech', 'umbrella']

  const derived: ControlSchema = {
    options: {
      type: 'range',
      min: 1,
      max: 4,
      default: 2,
      derive: (n) => CLIENTS.slice(0, n),
    },
    width: { type: 'radio', options: ['auto', 'full'], default: 'auto' },
  }

  it('replaces a derived control value with what derive returns', () => {
    const values = deriveControlValues(derived, coerceControlValues(derived, {}))

    expect(values.options).toEqual(['acme', 'globex'])
  })

  it('leaves a control without derive as it was', () => {
    const values = deriveControlValues(derived, coerceControlValues(derived, {}))

    expect(values.width).toBe('auto')
  })

  it('re-derives from a changed value', () => {
    const values = deriveControlValues(
      derived,
      coerceControlValues(derived, { options: 4 })
    )

    expect(values.options).toEqual(CLIENTS)
  })

  it('hands each derive its own control value and nothing else', () => {
    const seen: unknown[][] = []
    const spied: ControlSchema = {
      count: {
        type: 'number',
        default: 3,
        derive: (...args) => {
          seen.push(args)
          return args[0]
        },
      },
      other: { type: 'text', default: 'x' },
    }

    deriveControlValues(spied, coerceControlValues(spied, {}))

    expect(seen).toEqual([[3]])
  })

  it('derives a group member, leaving the rest of the group alone', () => {
    const schema: ControlSchema = {
      variants: {
        onSurface: { type: 'radio', options: ['base', 'raised'], default: 'base' },
        tone: {
          type: 'boolean',
          default: true,
          derive: (ok) => (ok ? 'success' : 'danger'),
        },
      },
    }

    const values = deriveControlValues(schema, coerceControlValues(schema, {}))

    expect(values.variants).toEqual({ onSurface: 'base', tone: 'success' })
  })

  it('tolerates values missing a group entirely', () => {
    const schema: ControlSchema = {
      variants: {
        tone: { type: 'boolean', derive: (ok) => (ok ? 'success' : 'danger') },
      },
    }

    expect(deriveControlValues(schema, {})).toEqual({ variants: { tone: 'danger' } })
  })

  // A host memoizes the values it hands to render. With nothing to derive there is
  // no reason to give it a new object to compare.
  it('returns the same values object when nothing in the schema derives', () => {
    const values = coerceControlValues(schema, {})

    expect(deriveControlValues(schema, values)).toBe(values)
    expect(deriveControlValues(grouped, values)).toBe(values)
  })

  it('does not mutate the raw values', () => {
    const raw = coerceControlValues(derived, {})
    const before = structuredClone(raw)

    deriveControlValues(derived, raw)

    expect(raw).toEqual(before)
  })
})

// A list's value is an array of rows, each drawn from its `of`. The URL carries it
// whole as JSON, and the router hands it back parsed, so coercion sees an array.
describe('list controls', () => {
  const sections: ControlSchema = {
    sections: {
      type: 'list',
      of: {
        title: { type: 'text', default: 'Untitled' },
        open: { type: 'boolean', default: false },
      },
      default: [{ title: 'One', open: true }],
    },
  }

  const tags: ControlSchema = {
    tags: { type: 'list', of: { type: 'select', options: ['a', 'b'], default: 'a' } },
  }

  it('defaults to the declared rows, or to no rows', () => {
    expect(defaultValues(sections)).toEqual({ sections: [{ title: 'One', open: true }] })
    expect(defaultValues(tags)).toEqual({ tags: [] })
  })

  it('builds a new row from the row schema defaults', () => {
    expect(listRowDefault(sections.sections as ListControlDef)).toEqual({
      title: 'Untitled',
      open: false,
    })
    expect(listRowDefault(tags.tags as ListControlDef)).toBe('a')
  })

  it('coerces each row of an array by the row schema', () => {
    const values = coerceControlValues(sections, {
      sections: [
        { title: 'A', open: 'true' },
        { title: 42, open: false },
      ],
    })

    expect(values.sections).toEqual([
      { title: 'A', open: true },
      { title: '42', open: false },
    ])
  })

  it('coerces a scalar row, dropping an option outside the list', () => {
    expect(coerceControlValues(tags, { tags: ['b', 'zzz', 'a'] }).tags).toEqual([
      'b',
      'a',
      'a',
    ])
  })

  it('fills a missing member of a row from its default', () => {
    expect(
      coerceControlValues(sections, { sections: [{ title: 'Only' }] }).sections
    ).toEqual([{ title: 'Only', open: false }])
  })

  it('reads a row that is not an object as a row of defaults', () => {
    expect(coerceControlValues(sections, { sections: ['nope'] }).sections).toEqual([
      { title: 'Untitled', open: false },
    ])
  })

  // A hand-edited URL, or an older router, can carry the JSON as a string.
  it('parses rows given as a JSON string', () => {
    const raw = JSON.stringify([{ title: 'Parsed', open: true }])

    expect(coerceControlValues(sections, { sections: raw }).sections).toEqual([
      { title: 'Parsed', open: true },
    ])
  })

  it('falls back to the default for a value that is not a list', () => {
    expect(coerceControlValues(sections, { sections: 'not json' })).toEqual(
      defaultValues(sections)
    )
    expect(coerceControlValues(sections, { sections: { title: 'x' } })).toEqual(
      defaultValues(sections)
    )
  })

  it('keeps an empty list, which is not the default here', () => {
    expect(coerceControlValues(sections, { sections: [] }).sections).toEqual([])
  })

  it('omits a list left at its default from the URL, by content', () => {
    expect(encodeControlValues(sections, defaultValues(sections))).toEqual({})
    expect(
      encodeControlValues(sections, { sections: [{ title: 'One', open: true }] })
    ).toEqual({})
  })

  it('encodes a changed list whole', () => {
    const values = {
      sections: [
        { title: 'One', open: true },
        { title: 'Two', open: false },
      ],
    }

    expect(encodeControlValues(sections, values)).toEqual(values)
  })

  it('round-trips a list through encode and coerce', () => {
    const values = { tags: ['b', 'b', 'a'] }

    expect(coerceControlValues(tags, encodeControlValues(tags, values))).toEqual(values)
  })

  it('derives each row through the row schema', () => {
    const schema: ControlSchema = {
      tags: { type: 'list', of: { type: 'range', min: 1, derive: (n) => 'x'.repeat(n) } },
      rows: {
        type: 'list',
        of: {
          n: { type: 'number' },
          on: { type: 'boolean', derive: (on) => (on ? 'yes' : 'no') },
        },
      },
    }
    const raw = coerceControlValues(schema, { tags: [1, 3], rows: [{ n: 2, on: true }] })

    expect(deriveControlValues(schema, raw)).toEqual({
      tags: ['x', 'xxx'],
      rows: [{ n: 2, on: 'yes' }],
    })
  })

  it('returns the same values object when no row derives', () => {
    const values = coerceControlValues(sections, {})

    expect(deriveControlValues(sections, values)).toBe(values)
  })
})
