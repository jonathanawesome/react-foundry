import type { ControlDef, ControlSchema, ControlValues } from './types'

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

/** The default values object for a whole schema. */
export function defaultValues(schema: ControlSchema): ControlValues {
  const values: Record<string, unknown> = {}
  for (const [name, def] of Object.entries(schema)) {
    values[name] = defaultValue(def)
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
 */
export function coerceControlValues(
  schema: ControlSchema,
  raw: Record<string, unknown>
): ControlValues {
  const values: Record<string, unknown> = {}
  for (const [name, def] of Object.entries(schema)) {
    // `??` not `||`, so a legitimate 0 / false / '' is not discarded.
    values[name] = coerceValue(def, raw[name]) ?? defaultValue(def)
  }
  return values as ControlValues
}

/**
 * Encodes control values for the URL, omitting any equal to their default so
 * the query string stays short.
 */
export function encodeControlValues(
  schema: ControlSchema,
  values: ControlValues
): Record<string, string> {
  const encoded: Record<string, string> = {}
  for (const [name, def] of Object.entries(schema)) {
    const value = (values as Record<string, unknown>)[name]
    if (value === undefined || value === defaultValue(def)) continue
    encoded[name] = String(value)
  }
  return encoded
}
