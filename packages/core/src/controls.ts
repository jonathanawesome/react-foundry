import type {
  ControlDef,
  ControlEntry,
  ControlGroup,
  ControlSchema,
  ControlValues,
} from './types'

/**
 * Separates a group name from a member name when control values are flattened
 * for the URL, so a group round-trips as `?variants.tone=success`.
 *
 * Safe to reserve: a group name and a member name are both prop names, and a prop
 * name cannot contain a dot.
 */
const GROUP_SEPARATOR = '.'

/**
 * True for a schema entry that is a single control rather than a group.
 *
 * Structural, and it has to be: `type` holding a string is what a control always
 * has and a group never does, since a group's own values are controls. A group
 * *key* named `type` is fine, which is why this reads the value's type rather
 * than testing for the key.
 */
export function isControlDef(entry: ControlEntry): entry is ControlDef {
  return typeof (entry as ControlDef).type === 'string'
}

/** The value a control falls back to when no `default` is declared. */
function zeroValue(def: ControlDef): string | number | boolean {
  switch (def.type) {
    case 'boolean':
      return false
    case 'number':
    case 'range':
      return def.min ?? 0
    case 'select':
    case 'radio':
      return def.options[0] ?? ''
    default:
      return ''
  }
}

/** The default value for one control: its declared `default`, else a zero value. */
function defaultValue(def: ControlDef): string | number | boolean {
  return def.default ?? zeroValue(def)
}

/** The default values object for one group: one entry per member control. */
function groupDefaults(group: ControlGroup): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const [name, def] of Object.entries(group)) {
    values[name] = defaultValue(def)
  }
  return values
}

/** The default values object for a whole schema. */
export function defaultValues(schema: ControlSchema): ControlValues {
  const values: Record<string, unknown> = {}
  for (const [name, entry] of Object.entries(schema)) {
    values[name] = isControlDef(entry) ? defaultValue(entry) : groupDefaults(entry)
  }
  return values as ControlValues
}

/**
 * Coerces one raw value to a control's declared type, or returns `undefined`
 * when it can't (so the caller falls back to the default).
 *
 * Raw values arrive already `JSON.parse`d by the router, so a text control's
 * value can show up as a boolean or number from a hand-edited URL. Coercion is
 * driven by the control's declared type, never the incoming JS type.
 */
function coerceValue(
  def: ControlDef,
  raw: unknown
): string | number | boolean | undefined {
  switch (def.type) {
    case 'boolean':
      if (typeof raw === 'boolean') return raw
      if (raw === 'true') return true
      if (raw === 'false') return false
      return undefined

    case 'number':
    case 'range': {
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? n : undefined
    }

    case 'select':
    case 'radio': {
      const s = String(raw)
      return def.options.includes(s) ? s : undefined
    }

    default:
      // text / color: any scalar becomes its string form.
      if (raw == null || typeof raw === 'object') return undefined
      return String(raw)
  }
}

/**
 * Merges raw URL values over a schema's defaults, coercing each to its declared
 * type. Missing, unparseable, or unknown params fall back to the default.
 *
 * Group members are read from flattened `group.member` params and rebuilt into a
 * nested object, so what `render` receives mirrors the prop it drives.
 */
export function coerceControlValues(
  schema: ControlSchema,
  raw: Record<string, unknown>
): ControlValues {
  const values: Record<string, unknown> = {}
  for (const [name, entry] of Object.entries(schema)) {
    // `??` not `||`, so a legitimate 0 / false / '' is not discarded.
    if (isControlDef(entry)) {
      values[name] = coerceValue(entry, raw[name]) ?? defaultValue(entry)
      continue
    }

    const group: Record<string, unknown> = {}
    for (const [member, def] of Object.entries(entry)) {
      const key = `${name}${GROUP_SEPARATOR}${member}`
      group[member] = coerceValue(def, raw[key]) ?? defaultValue(def)
    }
    values[name] = group
  }
  return values as ControlValues
}

/**
 * Encodes control values for the URL, omitting any equal to their default so
 * the query string stays short.
 *
 * A group is flattened one key per member rather than serialized whole, so a
 * single edited member costs one short param and the rest stay out of the URL.
 */
export function encodeControlValues(
  schema: ControlSchema,
  values: ControlValues
): Record<string, string> {
  const encoded: Record<string, string> = {}
  for (const [name, entry] of Object.entries(schema)) {
    const value = (values as Record<string, unknown>)[name]

    if (isControlDef(entry)) {
      if (value === undefined || value === defaultValue(entry)) continue
      encoded[name] = String(value)
      continue
    }

    const group = (value ?? {}) as Record<string, unknown>
    for (const [member, def] of Object.entries(entry)) {
      const memberValue = group[member]
      if (memberValue === undefined || memberValue === defaultValue(def)) continue
      encoded[`${name}${GROUP_SEPARATOR}${member}`] = String(memberValue)
    }
  }
  return encoded
}
