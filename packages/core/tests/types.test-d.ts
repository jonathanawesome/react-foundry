import {
  type ComponentProps,
  type ComponentType,
  forwardRef,
  type ReactNode,
} from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import { controlsFor, createPreview, defineControls } from '../src/create-preview'
import type {
  ControllableProps,
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

// Fixtures for controlsFor. Written here rather than imported because core depends
// on no component package, and the repo has no forwardRef component to point at.
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'large'
  disabled?: boolean
  /** Open string: takes free input, and a curated dropdown too. */
  title?: string
  count?: number
  children?: ReactNode
  onClick?: () => void
}

const Button = (_props: ButtonProps): ReactNode => null

function PlainButton(_props: ButtonProps): ReactNode {
  return null
}

const ForwardButton = forwardRef<HTMLButtonElement, ButtonProps>((_props, _ref) => null)

/** No prop any control can drive, so no playground is meaningful for it. */
const SlotOnly = (_props: { renderItem: () => ReactNode }): ReactNode => null

/** The shape cva and vanilla-extract's RecipeVariants produce. */
const Card = (_props: { variant?: 'default' | 'selectable' | undefined }): ReactNode =>
  null

interface DomButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'danger'
}

const DomButton = (_props: DomButtonProps): ReactNode => null

interface EdgeProps {
  nullable?: 'a' | 'b' | null
  // biome-ignore lint/suspicious/noExplicitAny: `inlist?: any` in @types/react is the real case
  loose?: any
  mystery?: unknown
  nothing?: never
}

const Edge = (_props: EdgeProps): ReactNode => null

/**
 * The motivating shape for control groups: cva's variants, handed to a component
 * as one object prop rather than as flat props. `VariantProps` produces exactly
 * this — optional keys, each nullable, each a closed union.
 */
interface StatCardProps {
  title: string
  value: ReactNode
  hint?: ReactNode
  icon?: ComponentType<{ className?: string }>
  variants?: {
    onSurface?: 'base' | 'raised' | null | undefined
    tone?: 'default' | 'success' | 'danger' | null | undefined
  }
  /** Plain data, not a variants bag: a group here is the same deal. */
  period?: { from: string; to: string }
  /** Nothing inside it a control can drive, so it yields an empty group. */
  slots?: { renderItem: () => ReactNode }
  /** An object one level deeper than a group goes. */
  nested?: { inner: { deep: string } }
}

const StatCard = (_props: StatCardProps): ReactNode => null

describe('controlsFor', () => {
  it('accepts controls that match the component and narrows their values', () => {
    const controls = controlsFor(Button, {
      variant: { type: 'select', options: ['primary', 'danger'], default: 'primary' },
      size: { type: 'radio', options: ['small', 'large'] },
      disabled: { type: 'boolean' },
      count: { type: 'number', min: 0 },
      title: { type: 'text' },
    })

    expectTypeOf<ControlValues<typeof controls>['variant']>().toEqualTypeOf<
      'primary' | 'danger'
    >()
    expectTypeOf<ControlValues<typeof controls>['size']>().toEqualTypeOf<
      'small' | 'large'
    >()
    expectTypeOf<ControlValues<typeof controls>['count']>().toEqualTypeOf<number>()
  })

  it('rejects a control naming no prop of the component', () => {
    controlsFor(Button, {
      // @ts-expect-error `varinat` is a typo, not a prop of Button
      varinat: { type: 'text' },
    })
  })

  it('rejects a control whose input type does not suit the prop', () => {
    controlsFor(Button, {
      // @ts-expect-error `disabled` is a boolean prop; a text box cannot drive it
      disabled: { type: 'text' },
    })
  })

  it('constrains options to the union the prop declares, so a typo cannot compile', () => {
    controlsFor(Button, {
      // @ts-expect-error 'dangre' is a typo and not a variant Button accepts
      variant: { type: 'select', options: ['primary', 'dangre'] },
    })
  })

  it('constrains a default to the union the prop declares', () => {
    controlsFor(Button, {
      // @ts-expect-error 'ghost' is not a variant Button accepts
      variant: { type: 'select', options: ['primary', 'danger'], default: 'ghost' },
    })
  })

  it('offers a dropdown as well as free input on an open string prop', () => {
    const controls = controlsFor(Button, {
      title: { type: 'select', options: ['Save', 'Cancel'] },
    })

    expectTypeOf<ControlValues<typeof controls>['title']>().toEqualTypeOf<
      'Save' | 'Cancel'
    >()
  })

  it('drives a ReactNode prop with a text control, since a string is a ReactNode', () => {
    const controls = controlsFor(Button, {
      children: { type: 'text', default: 'Click me' },
    })

    expectTypeOf<ControlValues<typeof controls>['children']>().toEqualTypeOf<string>()
  })

  it('rejects a control a ReactNode prop cannot take', () => {
    controlsFor(Button, {
      // @ts-expect-error a checkbox cannot drive a ReactNode slot
      children: { type: 'boolean' },
    })
  })

  // The point of the whole exercise: a component with nothing to control says so at
  // the first control you write, rather than presenting a UI no call site can produce.
  it('leaves a component with no controllable prop with no controls at all', () => {
    expectTypeOf<keyof ControllableProps<typeof SlotOnly>>().toBeNever()

    controlsFor(SlotOnly, {
      // @ts-expect-error SlotOnly has no prop any control can drive
      anything: { type: 'text' },
    })
  })

  it('excludes props no control can drive, rather than mapping them to never', () => {
    expectTypeOf<keyof ControllableProps<typeof Button>>().toEqualTypeOf<
      'variant' | 'size' | 'disabled' | 'title' | 'count' | 'children'
    >()
  })

  it('reads a variants-derived optional union as options', () => {
    const controls = controlsFor(Card, {
      variant: { type: 'radio', options: ['default', 'selectable'], default: 'default' },
    })

    expectTypeOf<ControlValues<typeof controls>['variant']>().toEqualTypeOf<
      'default' | 'selectable'
    >()
  })

  it('reads props off a plain function, a forwardRef, and an intrinsic element', () => {
    controlsFor(PlainButton, { variant: { type: 'select', options: ['primary'] } })
    controlsFor(ForwardButton, { variant: { type: 'select', options: ['primary'] } })
    controlsFor('button', { type: { type: 'select', options: ['submit', 'reset'] } })
  })

  it('still checks a component that inherits every DOM attribute', () => {
    controlsFor(DomButton, {
      variant: { type: 'select', options: ['primary', 'danger'] },
      disabled: { type: 'boolean' },
    })

    controlsFor(DomButton, {
      // @ts-expect-error 'dangre' is a typo, even among ~97 inherited DOM props
      variant: { type: 'select', options: ['primary', 'dangre'] },
    })
  })

  it('types render values end to end through createPreview', () => {
    createPreview({
      controls: controlsFor(Button, {
        variant: { type: 'select', options: ['primary', 'danger'] },
        disabled: { type: 'boolean' },
      }),
      render: (v) => {
        expectTypeOf(v.variant).toEqualTypeOf<'primary' | 'danger'>()
        expectTypeOf(v.disabled).toEqualTypeOf<boolean>()
        return null
      },
    })
  })

  // A schema derived from a bound one keeps its literal types, so overriding a
  // default in a second preview does not quietly opt back out of the checking.
  it('keeps a spread of a bound schema bound', () => {
    const base = controlsFor(Button, {
      variant: { type: 'select', options: ['primary', 'danger'], default: 'primary' },
    })

    const derived = { ...base, variant: { ...base.variant, default: 'danger' } } as const

    expectTypeOf<ControlValues<typeof derived>['variant']>().toEqualTypeOf<
      'primary' | 'danger'
    >()
  })
})

describe('controlsFor control groups', () => {
  it('mirrors an object prop with a group, and nests its values to match', () => {
    const controls = controlsFor(StatCard, {
      title: { type: 'text', default: 'Requests' },
      variants: {
        onSurface: { type: 'radio', options: ['base', 'raised'], default: 'raised' },
        tone: { type: 'select', options: ['default', 'success'], default: 'default' },
      },
    })

    // `readonly` because `controlsFor` takes a `const` type parameter, which is what
    // keeps the option literals. Readonly members stay assignable to the prop.
    expectTypeOf<ControlValues<typeof controls>['variants']>().toEqualTypeOf<{
      readonly onSurface: 'base' | 'raised'
      readonly tone: 'default' | 'success'
    }>()
  })

  // The ergonomic win: the values mirror the props, so render stays a pass-through.
  it('hands a group straight back to the prop it describes', () => {
    createPreview({
      controls: controlsFor(StatCard, {
        variants: {
          onSurface: { type: 'radio', options: ['base', 'raised'] },
        },
      }),
      render: (v) => StatCard({ title: 't', value: null, variants: v.variants }),
    })
  })

  it('rejects a control naming a key the object prop does not have', () => {
    controlsFor(StatCard, {
      variants: {
        // @ts-expect-error `onSurfce` is a typo, not a key of the variants bag
        onSurfce: { type: 'radio', options: ['base', 'raised'] },
      },
    })
  })

  it('constrains options inside a group to that key own union', () => {
    controlsFor(StatCard, {
      variants: {
        // @ts-expect-error 'raize' is a typo and not a value onSurface accepts
        onSurface: { type: 'radio', options: ['base', 'raize'] },
      },
    })
  })

  it('rejects a control type the key inside the group cannot take', () => {
    controlsFor(StatCard, {
      variants: {
        // @ts-expect-error a checkbox cannot drive a string union
        tone: { type: 'boolean' },
      },
    })
  })

  it('groups a plain data object prop as readily as a variants bag', () => {
    const controls = controlsFor(StatCard, {
      period: { from: { type: 'text' }, to: { type: 'text' } },
    })

    expectTypeOf<ControlValues<typeof controls>['period']>().toEqualTypeOf<{
      readonly from: string
      readonly to: string
    }>()
  })

  // ReactNode includes ReactElement, which is an object. The scalar arms have to
  // keep their precedence or a slot prop turns into a group over an element.
  it('leaves a ReactNode prop a text control rather than a group', () => {
    const controls = controlsFor(StatCard, { hint: { type: 'text', default: '' } })

    expectTypeOf<ControlValues<typeof controls>['hint']>().toEqualTypeOf<string>()
  })

  // ComponentType is a callable unioned with a constructable; neither half's
  // signature describes the union, so this is the guard that catches it.
  it('drops a component-typed prop instead of grouping its members', () => {
    expectTypeOf<keyof ControllableProps<typeof StatCard>>().toEqualTypeOf<
      'title' | 'value' | 'hint' | 'variants' | 'period'
    >()

    controlsFor(StatCard, {
      // @ts-expect-error `icon` takes a component, which no control can author
      icon: { displayName: { type: 'text' } },
    })
  })

  it('drops an object prop with nothing drivable inside it', () => {
    controlsFor(StatCard, {
      // @ts-expect-error `slots` holds a render prop, which no control can drive
      slots: { renderItem: { type: 'text' } },
    })
  })

  // One level deep is the whole feature: an object inside a group drives nothing,
  // which leaves `nested` with an empty group and so no entry at all.
  it('stops nesting at one level', () => {
    controlsFor(StatCard, {
      // @ts-expect-error a group holds controls, never further groups
      nested: { inner: { deep: { type: 'text' } } },
    })
  })

  // Every component extending an intrinsic element's props carries `style`, so the
  // object arm now reaches a few hundred keys. It has to stay a typecheck, not a
  // recursion the compiler gives up on.
  it('handles a CSSProperties-sized group on a DOM component', () => {
    const controls = controlsFor(DomButton, {
      style: { color: { type: 'color', default: '#ff0000' } },
    })

    expectTypeOf<ControlValues<typeof controls>['style']>().toEqualTypeOf<{
      readonly color: string
    }>()

    controlsFor(DomButton, {
      // @ts-expect-error `colour` is not a CSS property
      style: { colour: { type: 'color' } },
    })
  })
})

// Each of these compiled silently, or resolved to the wrong control, in a draft of
// these types. They are guards rather than documentation of intent.
describe('controlsFor edge cases', () => {
  it('keeps a nullable prop controllable, and reads its union without the null', () => {
    const controls = controlsFor(Edge, {
      nullable: { type: 'select', options: ['a', 'b'] },
    })

    expectTypeOf<ControlValues<typeof controls>['nullable']>().toEqualTypeOf<'a' | 'b'>()
  })

  it('excludes props typed any, unknown, or never', () => {
    expectTypeOf<keyof ControllableProps<typeof Edge>>().toEqualTypeOf<'nullable'>()
  })

  it('does not offer a checkbox for a prop typed any', () => {
    controlsFor(Edge, {
      // @ts-expect-error `loose` is `any`, which is not a controllable prop
      loose: { type: 'boolean' },
    })
  })
})
