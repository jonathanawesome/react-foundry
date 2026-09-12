import {
  type ComponentProps,
  type ComponentType,
  createElement,
  forwardRef,
  type ReactNode,
} from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import { controlsFor, createPreview, defineControls } from '../src/create-preview'
import type {
  ControllableProps,
  ControlSchema,
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

  // The point of the whole exercise: a component with nothing an input can express
  // says so at the first control you write, rather than presenting a UI no call site
  // can produce. Its render prop is reachable through `derive` and nothing else.
  it('leaves a component with no input-driven prop with no plain controls at all', () => {
    expectTypeOf<keyof ControllableProps<typeof SlotOnly>>().toEqualTypeOf<'renderItem'>()

    controlsFor(SlotOnly, {
      // @ts-expect-error SlotOnly has no prop any control can drive
      anything: { type: 'text' },
    })

    controlsFor(SlotOnly, {
      // @ts-expect-error a render prop takes no input; only a derive can produce one
      renderItem: { type: 'text' },
    })
  })

  // `onClick` is here because a derive can produce a function; every other prop is
  // here because an input can drive it directly.
  it('keeps every real prop, since a derive can target any of them', () => {
    expectTypeOf<keyof ControllableProps<typeof Button>>().toEqualTypeOf<
      'variant' | 'size' | 'disabled' | 'title' | 'count' | 'children' | 'onClick'
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
  // signature describes the union, so this is the guard that catches it. The prop
  // stays in the key set, reachable through a derive, but never as a group.
  it('refuses to group a component-typed prop', () => {
    expectTypeOf<keyof ControllableProps<typeof StatCard>>().toEqualTypeOf<
      'title' | 'value' | 'hint' | 'icon' | 'variants' | 'period' | 'slots' | 'nested'
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

/**
 * Fixtures for `derive`: the three prop shapes no input can express. An array
 * (`options`), a component (`icon`, on StatCard above), and a node built from a
 * flag (`titleAccessory`).
 */
interface SelectOption {
  value: string
  label: string
}

const CLIENTS: SelectOption[] = [
  { value: 'acme', label: 'Acme' },
  { value: 'globex', label: 'Globex' },
]

interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'full'
}

const Select = (_props: SelectProps): ReactNode => null

const Globe = (_props: { className?: string }): ReactNode => null
const Gauge = (_props: { className?: string }): ReactNode => null
const ICONS = { globe: Globe, gauge: Gauge }

const Badge = (_props: { content: string }): ReactNode => null

const PageLead = (_props: { title: string; titleAccessory?: ReactNode }): ReactNode =>
  null

describe('controlsFor derive', () => {
  it('derives an array prop from a range, and types the value as the array', () => {
    const controls = controlsFor(Select, {
      options: {
        type: 'range',
        min: 1,
        max: 10,
        default: 4,
        derive: (n) => {
          expectTypeOf(n).toEqualTypeOf<number>()
          return CLIENTS.slice(0, n)
        },
      },
      width: {
        type: 'radio',
        options: ['auto', 'sm', 'md', 'lg', 'full'],
        default: 'auto',
      },
    })

    expectTypeOf<ControlValues<typeof controls>['options']>().toEqualTypeOf<
      SelectOption[]
    >()
    expectTypeOf<ControlValues<typeof controls>['width']>().toEqualTypeOf<
      'auto' | 'sm' | 'md' | 'lg' | 'full'
    >()
  })

  // The parameter comes from the options written beside it, not from the prop, so
  // a lookup table keyed by those options needs no cast.
  it('derives a component prop from a select, with the parameter narrowed to its options', () => {
    const controls = controlsFor(StatCard, {
      icon: {
        type: 'select',
        options: ['globe', 'gauge'],
        default: 'globe',
        derive: (name) => {
          expectTypeOf(name).toEqualTypeOf<'globe' | 'gauge'>()
          return ICONS[name]
        },
      },
    })

    expectTypeOf<ControlValues<typeof controls>['icon']>().toEqualTypeOf<
      (_props: { className?: string }) => ReactNode
    >()
  })

  it('derives a ReactNode prop from a boolean', () => {
    const controls = controlsFor(PageLead, {
      titleAccessory: {
        type: 'boolean',
        default: false,
        derive: (on) => {
          expectTypeOf(on).toEqualTypeOf<boolean>()
          return on ? createElement(Badge, { content: 'Beta' }) : undefined
        },
      },
    })

    expectTypeOf<ControlValues<typeof controls>['titleAccessory']>().toExtend<ReactNode>()
  })

  it('rejects a derive whose return type does not match the prop', () => {
    controlsFor(Select, {
      // @ts-expect-error a string is not SelectOption[]
      options: { type: 'range', derive: (n) => String(n) },
    })

    controlsFor(StatCard, {
      // @ts-expect-error a string is not a component
      icon: { type: 'select', options: ['globe', 'gauge'], derive: (name) => name },
    })
  })

  it('rejects a derive typed narrower than the options beside it', () => {
    controlsFor(StatCard, {
      icon: {
        type: 'select',
        options: ['globe', 'gauge'],
        // @ts-expect-error `gauge` is an option this derive never accepts
        derive: (name: 'globe') => ICONS[name],
      },
    })
  })

  // The key stays checked. Only the input is freed, and only through the mapping.
  it('rejects a derived control on a prop the component does not have', () => {
    controlsFor(Select, {
      // @ts-expect-error `optoins` is a typo, not a prop of Select
      optoins: { type: 'range', derive: (n) => CLIENTS.slice(0, n) },
    })
  })

  it('leaves a scalar control without derive exactly as it was', () => {
    const controls = controlsFor(Select, {
      width: { type: 'radio', options: ['auto', 'full'], default: 'auto' },
    })

    expectTypeOf(controls.width).toEqualTypeOf<{
      readonly type: 'radio'
      readonly options: readonly ['auto', 'full']
      readonly default: 'auto'
    }>()
    expectTypeOf<ControlValues<typeof controls>['width']>().toEqualTypeOf<
      'auto' | 'full'
    >()
  })

  it('accepts a derive on a member of a control group', () => {
    const controls = controlsFor(StatCard, {
      variants: {
        onSurface: {
          type: 'select',
          options: ['up', 'down'],
          derive: (direction) => {
            expectTypeOf(direction).toEqualTypeOf<'up' | 'down'>()
            return direction === 'up' ? 'raised' : 'base'
          },
        },
        tone: { type: 'boolean', derive: (ok) => (ok ? 'success' : 'danger') },
      },
    })

    expectTypeOf<ControlValues<typeof controls>['variants']>().toEqualTypeOf<{
      readonly onSurface: 'base' | 'raised'
      readonly tone: 'success' | 'danger'
    }>()
  })

  it('rejects a derive inside a group whose return does not match the member', () => {
    controlsFor(StatCard, {
      variants: {
        // @ts-expect-error a number is not a tone
        tone: { type: 'boolean', derive: (ok) => (ok ? 1 : 0) },
      },
    })
  })

  // Off controlsFor there is no component to bind to, and the option narrowing goes
  // with it: a select's derive sees `string`. Every other kind is typed from its
  // own arm, and the derived value still types render.
  it('types a derive from ControlDef alone in defineControls and an inline schema', () => {
    const controls = defineControls({
      icon: {
        type: 'select',
        options: ['globe', 'gauge'],
        derive: (name) => {
          expectTypeOf(name).toEqualTypeOf<string>()
          return name.length
        },
      },
    })

    expectTypeOf<ControlValues<typeof controls>['icon']>().toEqualTypeOf<number>()

    createPreview({
      controls: {
        options: {
          type: 'range',
          default: 2,
          derive: (n) => {
            expectTypeOf(n).toEqualTypeOf<number>()
            return CLIENTS.slice(0, n)
          },
        },
      },
      render: (v) => {
        expectTypeOf(v.options).toEqualTypeOf<SelectOption[]>()
        return null
      },
    })
  })

  // A schema narrowed by controlsFor is still a ControlSchema, which is what lets
  // createPreview take it: a derive typed against `'globe' | 'gauge'` has to satisfy
  // a select arm declared against `string`.
  it('keeps a schema with a narrowed derive assignable to ControlSchema', () => {
    const controls = controlsFor(StatCard, {
      icon: {
        type: 'select',
        options: ['globe', 'gauge'],
        derive: (name) => ICONS[name],
      },
    })
    const schema: ControlSchema = controls

    createPreview({
      controls,
      render: (v) => {
        expectTypeOf(v.icon).toEqualTypeOf<
          (_props: { className?: string }) => ReactNode
        >()
        return null
      },
    })
    void schema
  })

  // A schema that arrives already widened has no literal to narrow from, and must
  // still be accepted: a `derive` on it is typed against ControlDef alone.
  it('still accepts a schema typed as ControlSchema', () => {
    const schema: ControlSchema = {
      count: { type: 'range', derive: (n) => n * 2 },
      icon: { type: 'select', options: ['globe'], derive: (name) => name.length },
    }

    defineControls(schema)
    createPreview({ controls: schema, render: () => null })
  })
})

/** Fixtures for the list control: an array of objects, an array of strings, a nested array. */
interface TagListProps {
  tags?: string[]
  matrix?: string[][]
  handlers?: (() => void)[]
  // biome-ignore lint/suspicious/noExplicitAny: an array of any is the case under test
  anything?: any[]
}

const TagList = (_props: TagListProps): ReactNode => null

describe('controlsFor list', () => {
  it('drives an array of objects with a list of groups, and types the rows', () => {
    const controls = controlsFor(Select, {
      options: {
        type: 'list',
        of: { value: { type: 'text' }, label: { type: 'text', default: 'Untitled' } },
        default: [{ value: 'acme', label: 'Acme' }],
      },
    })

    expectTypeOf<ControlValues<typeof controls>['options']>().toEqualTypeOf<
      { readonly value: string; readonly label: string }[]
    >()
  })

  it('drives an array of strings with a list of one control', () => {
    const controls = controlsFor(TagList, {
      tags: { type: 'list', of: { type: 'text' }, default: ['new'] },
    })

    expectTypeOf<ControlValues<typeof controls>['tags']>().toEqualTypeOf<string[]>()
  })

  it('accepts a derive on a row, and on a member of a row', () => {
    const controls = controlsFor(TagList, {
      tags: {
        type: 'list',
        of: { type: 'range', min: 1, max: 5, derive: (n) => 'x'.repeat(n) },
      },
    })
    expectTypeOf<ControlValues<typeof controls>['tags']>().toEqualTypeOf<string[]>()

    const members = controlsFor(Select, {
      options: {
        type: 'list',
        of: {
          value: { type: 'text' },
          label: { type: 'boolean', derive: (on) => (on ? 'On' : 'Off') },
        },
      },
    })
    expectTypeOf<ControlValues<typeof members>['options']>().toEqualTypeOf<
      { readonly value: string; readonly label: 'On' | 'Off' }[]
    >()
  })

  // The option narrowing reaches a row's select the same as a top-level one, both
  // when the row is that select and when the select is a member of a row group.
  it('narrows a select derive in a row to its options', () => {
    controlsFor(TagList, {
      tags: {
        type: 'list',
        of: {
          type: 'select',
          options: ['a', 'b'],
          derive: (k) => {
            expectTypeOf(k).toEqualTypeOf<'a' | 'b'>()
            return k
          },
        },
      },
    })

    controlsFor(Select, {
      options: {
        type: 'list',
        of: {
          value: { type: 'text' },
          label: {
            type: 'select',
            options: ['x', 'y'],
            derive: (k) => {
              expectTypeOf(k).toEqualTypeOf<'x' | 'y'>()
              return k.toUpperCase()
            },
          },
        },
      },
    })
  })

  it('rejects a key in a row schema that the item does not have', () => {
    controlsFor(Select, {
      options: {
        type: 'list',
        of: {
          value: { type: 'text' },
          // @ts-expect-error `lable` is a typo, not a key of SelectOption
          lable: { type: 'text' },
        },
      },
    })
  })

  it('rejects a row control the item cannot take', () => {
    controlsFor(Select, {
      options: {
        type: 'list',
        // @ts-expect-error a SelectOption is an object; a checkbox cannot be one
        of: { value: { type: 'boolean' } },
      },
    })
  })

  it('rejects a list on a prop that is not an array', () => {
    controlsFor(Button, {
      // @ts-expect-error `title` is a string, not an array
      title: { type: 'list', of: { type: 'text' } },
    })
  })

  it('rejects a default row the row schema cannot produce', () => {
    controlsFor(Select, {
      options: {
        type: 'list',
        of: { value: { type: 'text' }, label: { type: 'text' } },
        // @ts-expect-error `lable` is a typo in the default row
        default: [{ value: 'a', lable: 'A' }],
      },
    })
  })

  // One level below the list is the whole feature. A list of lists has no panel
  // to draw it in, and an array item offers no arm at all.
  it('does not nest a list inside a list', () => {
    controlsFor(TagList, {
      // @ts-expect-error `matrix` is an array of arrays; a row cannot be a list
      matrix: { type: 'list', of: { type: 'list', of: { type: 'text' } } },
    })
  })

  it('does not put a list inside a group', () => {
    controlsFor(StatCard, {
      variants: {
        // @ts-expect-error a group holds controls, never a list
        tone: { type: 'list', of: { type: 'text' } },
      },
    })
  })

  it('offers a list of derived rows for an array of callables, and nothing plainer', () => {
    controlsFor(TagList, {
      handlers: {
        type: 'list',
        of: { type: 'boolean', derive: (on) => (on ? () => {} : () => {}) },
      },
    })

    controlsFor(TagList, {
      // @ts-expect-error a function is not a text box
      handlers: { type: 'list', of: { type: 'text' } },
    })
  })

  it('offers no list for an array of any', () => {
    controlsFor(TagList, {
      // @ts-expect-error `anything` is any[], which no list can check
      anything: { type: 'list', of: { type: 'text' } },
    })
  })

  it('types a list in defineControls and reads it back in render', () => {
    const controls = defineControls({
      sections: {
        type: 'list',
        of: { title: { type: 'text' }, body: { type: 'text' } },
        default: [{ title: 'One', body: 'First' }],
      },
    })

    createPreview({
      controls,
      render: (v) => {
        expectTypeOf(v.sections).toEqualTypeOf<
          { readonly title: string; readonly body: string }[]
        >()
        return null
      },
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
