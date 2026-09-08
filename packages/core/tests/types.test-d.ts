import { type ComponentProps, forwardRef, type ReactNode } from 'react'
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
