import { describe, expectTypeOf, it } from 'vitest'

import type { ControlValues, NavPath, Preview, ResolveNavPath } from '../src/types'

describe('ResolveNavPath', () => {
  it('falls back to string when the register declares no paths', () => {
    expectTypeOf<ResolveNavPath<Record<string, never>>>().toEqualTypeOf<string>()
  })

  it('resolves to the declared union when the register carries paths', () => {
    type Registered = { navPath: 'Forms' | 'Forms/Button' }

    expectTypeOf<ResolveNavPath<Registered>>().toEqualTypeOf<'Forms' | 'Forms/Button'>()
  })

  it('rejects a path outside the declared union', () => {
    type Registered = { navPath: 'Forms' | 'Forms/Button' }

    // @ts-expect-error 'Forms/Buton' is a typo and not in the union
    const typo: ResolveNavPath<Registered> = 'Forms/Buton'
    void typo
  })

  it('accepts a path inside the declared union', () => {
    type Registered = { navPath: 'Forms' | 'Forms/Button' }

    const ok: ResolveNavPath<Registered> = 'Forms/Button'
    void ok
  })
})

describe('NavPath', () => {
  // Core itself is never augmented, so this pins the no-config fallback that
  // lets previews typecheck before the first codegen run. The augmented case is
  // covered by ResolveNavPath above and by the cli's write-nav-types tests.
  it('is plain string without a generated augmentation', () => {
    expectTypeOf<NavPath>().toEqualTypeOf<string>()
  })
})

describe('Preview', () => {
  it('is callable and returns an element', () => {
    expectTypeOf<Preview>().toBeCallableWith()
    expectTypeOf<Preview>().returns.not.toBeAny()
  })

  it('carries an optional label', () => {
    expectTypeOf<Preview['label']>().toEqualTypeOf<string | undefined>()
  })
})

describe('ControlValues', () => {
  // Each control def maps to the value type render receives, so v.x is typed.
  it('maps each control def to its value type', () => {
    type Schema = {
      label: { type: 'text' }
      variant: { type: 'select'; options: string[] }
      count: { type: 'number' }
      volume: { type: 'range' }
      disabled: { type: 'boolean' }
      tint: { type: 'color' }
    }

    expectTypeOf<ControlValues<Schema>>().toEqualTypeOf<{
      label: string
      variant: string
      count: number
      volume: number
      disabled: boolean
      tint: string
    }>()
  })

  it('rejects reading a control that is not in the schema', () => {
    type Values = ControlValues<{ variant: { type: 'text' } }>

    // @ts-expect-error `varinat` is a typo, not a declared control
    const typo: string = ({} as Values).varinat
    void typo
  })
})
