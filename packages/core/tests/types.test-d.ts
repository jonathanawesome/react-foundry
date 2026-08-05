import { describe, expectTypeOf, it } from 'vitest'

import { createPreview, defineControls } from '../src/create-preview'
import type {
  ControlValues,
  NavPath,
  NavPathsOf,
  Preview,
  ResolveNavPath,
} from '../src/types'

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

// The codegen-free route to the same union NavPath carries: derived from the config
// rather than an emitted `foundry-nav.gen.d.ts`.
describe('NavPathsOf', () => {
  it('emits parents as well as leaves, so a preview can sit on a group', () => {
    type Nav = readonly [
      {
        readonly label: 'Forms'
        readonly children: readonly [{ readonly label: 'Button' }]
      },
    ]

    expectTypeOf<NavPathsOf<Nav>>().toEqualTypeOf<'Forms' | 'Forms/Button'>()
  })

  it('reads the tree off a config object as well as a bare tree', () => {
    type Config = { nav: readonly [{ readonly label: 'Forms' }]; title: string }

    expectTypeOf<NavPathsOf<Config>>().toEqualTypeOf<'Forms'>()
  })

  it('nests to arbitrary depth', () => {
    type Nav = readonly [
      {
        readonly label: 'a'
        readonly children: readonly [
          { readonly label: 'b'; readonly children: readonly [{ readonly label: 'c' }] },
        ]
      },
    ]

    expectTypeOf<NavPathsOf<Nav>>().toEqualTypeOf<'a' | 'a/b' | 'a/b/c'>()
  })

  it('rejects a path outside the declared tree', () => {
    type Nav = readonly [
      {
        readonly label: 'Forms'
        readonly children: readonly [{ readonly label: 'Button' }]
      },
    ]

    // @ts-expect-error 'Forms/Buton' is a typo and not in the tree
    const typo: NavPathsOf<Nav> = 'Forms/Buton'
    void typo
  })

  // Widened labels name no particular path, so the union collapses to `string`: the
  // same degradation NavPath makes with no augmentation present, and the reason a tree
  // has to go through `defineNav` (or `as const`) to be worth anything.
  it('degrades to string when the labels are not literal', () => {
    expectTypeOf<NavPathsOf<{ label: string }[]>>().toEqualTypeOf<string>()
  })

  // Reaching for this before declaring a tree is an easy order to write it in. Resolving
  // to `never` there would reject every path with an error naming no cause.
  it('degrades to string for a config that declares no nav at all', () => {
    expectTypeOf<
      NavPathsOf<{ previews: string; title: string }>
    >().toEqualTypeOf<string>()
  })

  it('degrades to string for a tree that is not a tree', () => {
    expectTypeOf<NavPathsOf<string>>().toEqualTypeOf<string>()
    expectTypeOf<NavPathsOf<undefined>>().toEqualTypeOf<string>()
  })

  // The optional `nav?` on FoundryConfig itself: present as a key, but carrying nothing
  // literal, so it lands in the same place rather than in `never`.
  it('degrades to string when nav is declared but widened', () => {
    type Config = { nav?: readonly { label: string }[] }

    expectTypeOf<NavPathsOf<Config>>().toEqualTypeOf<string>()
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

  it('narrows a select value to the union of its literal options', () => {
    const controls = defineControls({
      variant: { type: 'select', options: ['primary', 'danger'] },
    })

    expectTypeOf<ControlValues<typeof controls>['variant']>().toEqualTypeOf<
      'primary' | 'danger'
    >()
  })
})

describe('createPreview typing', () => {
  it('types render values from an inline schema, narrowing select options', () => {
    createPreview({
      controls: {
        variant: { type: 'select', options: ['primary', 'danger'] },
        count: { type: 'number' },
      },
      render: (v) => {
        expectTypeOf(v.variant).toEqualTypeOf<'primary' | 'danger'>()
        expectTypeOf(v.count).toEqualTypeOf<number>()
        return null
      },
    })
  })

  it('types render values from a schema extracted via defineControls', () => {
    const controls = defineControls({
      size: { type: 'radio', options: ['sm', 'lg'] },
      on: { type: 'boolean' },
    })

    createPreview({
      controls,
      render: (v) => {
        expectTypeOf(v.size).toEqualTypeOf<'sm' | 'lg'>()
        expectTypeOf(v.on).toEqualTypeOf<boolean>()
        return null
      },
    })
  })

  it('rejects reading a control the schema does not declare', () => {
    createPreview({
      controls: { variant: { type: 'text' } },
      // @ts-expect-error `size` is not a declared control
      render: (v) => v.size,
    })
  })
})
