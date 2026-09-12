import type { ComponentProps, ElementType, ReactNode } from 'react'

/**
 * Augmented by the generated `foundry-nav.gen.d.ts` in the user's project to
 * carry the set of nav paths declared in their config. Empty here on purpose:
 * consumers with no config fall back to plain `string`.
 *
 * Same declaration-merging pattern TanStack Router uses for its route tree.
 */
// biome-ignore lint/suspicious/noEmptyInterface: intentionally empty, users augment it
export interface Register {}

/**
 * Pulls the declared nav paths out of a {@link Register}, falling back to
 * `string` when it carries none.
 *
 * Split out from {@link NavPath} so it can be exercised with both an augmented
 * and an unaugmented register. Declaration merging is global to a compilation,
 * so a test file cannot augment `Register` without affecting every other
 * assertion in the same run.
 */
export type ResolveNavPath<R> = R extends { navPath: infer P extends string } ? P : string

/**
 * A slash-delimited position in the nav tree, e.g. `'Forms/Button'`.
 *
 * Resolves to a union of the paths declared in `foundry.config.ts` once the
 * generated types are present, giving autocomplete and typo errors. Degrades
 * to `string` when there is no config, so previews still typecheck without one.
 */
export type NavPath = ResolveNavPath<Register>

/** Joins a nav path prefix to a label, matching how the tree builds paths. */
type JoinNavPath<Prefix extends string, Label extends string> = Prefix extends ''
  ? Label
  : `${Prefix}/${Label}`

/** Walks a declared tree depth first, emitting every prefix. See {@link NavPathsOf}. */
type FlattenNavItems<
  Items,
  Prefix extends string = '',
> = Items extends readonly (infer Item)[]
  ? Item extends { label: infer Label extends string }
    ?
        | JoinNavPath<Prefix, Label>
        | (Item extends { children: infer Children }
            ? FlattenNavItems<Children, JoinNavPath<Prefix, Label>>
            : never)
    : never
  : never

/**
 * The union of every path in a declared nav tree, parents included, so a preview
 * can sit on `'Forms'` as well as `'Forms/Button'`.
 *
 * The type-level twin of the codegen behind {@link NavPath}: it derives the same union
 * straight from the config, with no generated file to place, gitignore, or exempt from
 * a linter, and no question of whether types were emitted before `tsc` ran. The cost is
 * a project-local type rather than an ambient one, which is arguably clearer since its
 * origin is visible at the import.
 *
 * Accepts either the config or the tree itself. Both need literal types to say anything,
 * which is what `defineNav` (or `as const`) is for:
 *
 * ```ts
 * // foundry.config.ts
 * const nav = defineNav([{ label: 'Forms', children: [{ label: 'Button' }] }])
 *
 * const config = defineConfig({ nav })
 * export default config
 * export type AppNavPath = NavPathsOf<typeof config> // 'Forms' | 'Forms/Button'
 * ```
 *
 * Anything it cannot read a tree out of collapses to `string`: widened labels, and a
 * config with no `nav` at all. That is the same degradation {@link NavPath} makes with
 * no augmentation present, so a project that reaches for this before declaring a tree
 * still typechecks instead of resolving to `never` and rejecting every path.
 */
export type NavPathsOf<T> = T extends { nav: infer Items }
  ? FlattenNavItems<Items>
  : T extends readonly unknown[]
    ? FlattenNavItems<T>
    : string

/**
 * Brand marking a function as a preview. Discovery filters on this rather than
 * guessing from shape, so helpers and fixtures exported from a `.preview.tsx`
 * file never leak into the nav tree.
 */
export const PREVIEW: unique symbol = Symbol.for('react-foundry.preview')

/**
 * Maps a control's own value to the value its prop receives. See {@link ControlDef}.
 */
export type Derive<V, R = unknown> = (value: V) => R

/**
 * One editable control on a preview, drawn as an input in the props panel.
 *
 * `options` is `readonly` so a schema declared `as const` or through
 * {@link defineControls} or {@link controlsFor} keeps its literal option types,
 * which lets a select's value narrow to the union of its options rather than
 * plain `string`.
 *
 * `derive`, when present, maps the input's value to whatever the prop actually
 * takes, so a range can drive an array prop and a select can drive a component
 * prop. The panel draws the input exactly as it would without it; the mapping is
 * applied to the values before they reach `render`. It receives this control's
 * value and nothing else, which keeps it a per-prop mapping rather than a place
 * to compose controls.
 *
 * A select or radio hands `derive` a `string` here, since a plain `ControlDef`
 * cannot see its own `options`. {@link controlsFor} narrows it to the union of the
 * options written beside it (see {@link DeriveNarrowing}), and the resulting
 * schema has to remain a `ControlSchema`, so those two arms declare `derive` as a
 * method: a method's parameter is checked bivariantly, and a `derive` typed
 * against `'globe' | 'gauge'` still satisfies one declared against `string`.
 *
 * `label` names the control in the panel. Without it the panel humanizes the
 * key (`onSurface` reads "On Surface"); with it the key still names the prop, and
 * the panel shows the key beside the prop's definition so the two stay linked.
 */
export type ControlDef =
  | { type: 'text'; label?: string; default?: string; derive?: Derive<string> }
  | { type: 'boolean'; label?: string; default?: boolean; derive?: Derive<boolean> }
  | {
      type: 'select'
      label?: string
      options: readonly string[]
      default?: string
      derive?(value: string): unknown
    }
  | {
      type: 'radio'
      label?: string
      options: readonly string[]
      default?: string
      derive?(value: string): unknown
    }
  | {
      type: 'number'
      label?: string
      default?: number
      min?: number
      max?: number
      step?: number
      derive?: Derive<number>
    }
  | {
      type: 'range'
      label?: string
      default?: number
      min?: number
      max?: number
      step?: number
      derive?: Derive<number>
    }
  | { type: 'color'; label?: string; default?: string; derive?: Derive<string> }

/**
 * Controls for the members of an object-typed prop, drawn as a labelled section
 * in the props panel.
 *
 * The shape a schema takes for a prop like cva's `variants` bag: the controls
 * mirror the prop, so a preview's `render` passes the group straight through
 * rather than reassembling an object from flat values.
 *
 * A group holds controls, never further groups. See {@link ControlFor} for why
 * the nesting stops at one level.
 */
export type ControlGroup = Record<string, ControlDef>

/** One row of a list control's value, as its input holds it: what one `of` entry produces. */
export type ListRow =
  | string
  | number
  | boolean
  | Record<string, string | number | boolean>

/**
 * A control for an array-typed prop: a list of rows, each drawn from the same
 * `of` schema, with add and remove in the props panel.
 *
 * `of` is a scalar control (a list of strings, say) or a group of them (a list of
 * objects), never another list. That is the one level of nesting below the list
 * the schema allows, which keeps the panel legible and the types cheap to
 * instantiate. A member of a group `of` may derive as any group member does; the
 * list itself does not, since its value already is the array, and mapping rows
 * belongs in `render`.
 *
 * Rows travel in the URL as JSON, and the whole list is omitted when it equals
 * its default.
 */
export type ListControlDef = {
  type: 'list'
  label?: string
  of: ControlDef | ControlGroup
  default?: readonly ListRow[]
}

/**
 * One entry in a schema: a control, a list, or a group of controls for an object
 * prop.
 *
 * They are told apart structurally. A control and a list carry a string `type`,
 * which a group never does since its own values are controls; a list's `type` is
 * `'list'` and a control's never is. So no marker property is needed at runtime
 * or in the types.
 */
export type ControlEntry = ControlDef | ListControlDef | ControlGroup

export type ControlSchema = Record<string, ControlEntry>

/**
 * The value type a single control's input holds: what the panel edits and what
 * `derive` receives. A select/radio narrows to the union of its options when
 * those options are literal, else `string`.
 *
 * For what `render` receives, which is this unless the control derives, see
 * {@link ControlValues}.
 */
export type ControlValue<D extends ControlDef> = D extends { type: 'boolean' }
  ? boolean
  : D extends { type: 'number' | 'range' }
    ? number
    : D extends { type: 'select' | 'radio'; options: readonly (infer O)[] }
      ? O
      : string

/**
 * The value a single control delivers to `render`: what its `derive` returns
 * when it has one, else the input's own value.
 *
 * Tested against a required `derive`, so an arm of {@link ControlDef}, where it
 * is optional, resolves to the input value. Only a schema that actually wrote a
 * `derive` resolves to its return type.
 */
type ResolvedControlValue<D extends ControlDef> = D extends {
  derive: (value: never) => infer R
}
  ? R
  : ControlValue<D>

/** The values object for one control group: one value per member control. */
export type ControlGroupValues<G extends ControlGroup> = {
  [K in keyof G]: ResolvedControlValue<G[K]>
}

/**
 * The value a single schema entry resolves to: a scalar for a control, a nested
 * object for a group, an array of rows for a list.
 *
 * `E` is naked so a union of entries distributes, which is what keeps an
 * unparameterized {@link ControlValues} meaningful. `Extract` rather than a bare
 * `E` because {@link ResolvedControlValue} and {@link ControlGroupValues} are
 * constrained, and a conditional's true branch does not narrow a type parameter
 * enough to satisfy one. A list resolves through its `of`, which is a control or
 * a group and so ends the recursion one level down.
 */
type ControlEntryValue<E> = E extends ListControlDef
  ? ControlEntryValue<Extract<E, ListControlDef>['of']>[]
  : E extends ControlDef
    ? ResolvedControlValue<Extract<E, ControlDef>>
    : E extends ControlGroup
      ? ControlGroupValues<Extract<E, ControlGroup>>
      : never

/**
 * The values object a controlled preview's `render` receives, typed from its
 * schema so `v.variant` autocompletes and a typo or wrong-type use is a compile
 * error. A control declared but never read is not flagged: TypeScript has no
 * unused-property check.
 *
 * A group entry resolves to a nested object, mirroring the prop it describes, so
 * `render` can hand it to the component as-is: `<Card variants={v.variants} />`.
 *
 * A control with a `derive` resolves to what it returns, not to the input's
 * value: a range deriving `SelectOption[]` reads as `SelectOption[]` in `render`.
 * A list resolves to an array of what its `of` resolves to.
 */
export type ControlValues<S extends ControlSchema = ControlSchema> = {
  [K in keyof S]: ControlEntryValue<S[K]>
}

/**
 * A select/radio whose options are the prop's own union.
 *
 * Non-empty on purpose: an empty `options` array leaves a control with no value to
 * take, and {@link ControlValue} would infer `never` for it.
 */
type OptionsControl<T> = {
  type: 'select' | 'radio'
  label?: string
  options: readonly [T, ...T[]]
  default?: T
}

/**
 * The single control a prop of type `T` can be driven by, or `never` when no
 * scalar input suits it.
 *
 * Each arm is a guard as much as a mapping, and the order matters:
 *
 * - `any` and `unknown` satisfy every test below, so they are rejected first. This
 *   is not hypothetical — `inlist?: any` in `@types/react` reaches every component
 *   whose props extend an intrinsic element's. Rejecting `unknown` here is also
 *   what strips a props type's index signature.
 * - `[never] extends [boolean]` is `true`, so `never` needs its own arm ahead of
 *   the boolean one or a `never`-typed prop offers a checkbox.
 * - A closed string union gets a dropdown of exactly its members. An open `string`
 *   also gets free input, since a curated dropdown on an open string prop is a
 *   legitimate thing to want.
 * - The last arm is for a prop that *accepts* a string without being one, which in
 *   practice means a `ReactNode` slot: a string is a valid `ReactNode`, so a text
 *   control there renders. It cannot author JSX, and is not meant to.
 */
type ScalarControlFor<T> = unknown extends T
  ? never
  : [T] extends [never]
    ? never
    : [T] extends [boolean]
      ? Extract<ControlDef, { type: 'boolean' }>
      : [T] extends [number]
        ? Extract<ControlDef, { type: 'number' | 'range' }>
        : [T] extends [string]
          ?
              | OptionsControl<T>
              | (string extends T
                  ? Extract<ControlDef, { type: 'text' | 'color' }>
                  : never)
          : string extends T
            ? Extract<ControlDef, { type: 'text' }>
            : never

/**
 * True when any member of `T` carries a call or construct signature.
 *
 * `T` is naked so a union distributes, which is the whole point: `ComponentType`
 * is `ComponentClass | FunctionComponent`, a constructable unioned with a
 * callable, and neither half's signature describes the union. Tested as a whole
 * it would satisfy neither guard, fall through to the object arm, and offer a
 * control group over a component's `displayName`.
 *
 * A mixed union answers `boolean`, so the caller's `extends [false]` test drops a
 * prop when *any* member is callable, which is the safe direction: half a
 * function is not a thing a props panel can drive.
 */
type IsCallable<T> = T extends (...args: never[]) => unknown
  ? true
  : T extends abstract new (
        ...args: never[]
      ) => unknown
    ? true
    : false

/**
 * The value a control's `derive` is handed, as seen from the control's own
 * declaration.
 *
 * `never` for a select or radio, on purpose: the parameter is narrowed to the
 * union of the options actually written, and that union is only known at the
 * call site. {@link DeriveNarrowing} contributes it there, and the two contextual
 * signatures combine by union, so `never | 'globe' | 'gauge'` is the union alone.
 * Anything wider than `never` here would swallow it.
 */
type DeriveInput<D extends ControlDef> = D extends { type: 'select' | 'radio' }
  ? never
  : ControlValue<D>

/**
 * A scalar control of any kind whose `derive` maps its value to a prop of type
 * `T`, or `never` for a prop no mapping should target.
 *
 * Generic over the control kind rather than a single arm, so the parameter of
 * `derive` is typed from the control the author chose: a range hands it a
 * number, a boolean a boolean, a select the union of its options. Its return
 * type is what the prop's type checks against, which is what frees the input
 * type without freeing the key: `options: SelectOption[]` takes a range with a
 * `derive`, and still takes nothing that is not a prop.
 *
 * `any`, `unknown` and `never` are rejected as {@link ScalarControlFor} rejects
 * them. A mapping into a prop typed `any` checks nothing, and those props are
 * mostly inherited noise (`inlist?: any`) that has no business in autocomplete.
 */
export type DerivedControlFor<T> = unknown extends T
  ? never
  : [NonNull<T>] extends [never]
    ? never
    : {
        [D in ControlDef as D['type']]: Omit<D, 'derive'> & {
          derive: Derive<DeriveInput<D>, T>
        }
      }[ControlDef['type']]

/** A group member: a scalar control, deriving or not. Stripped as {@link ControlFor} strips. */
type GroupMemberControlFor<V> = DerivedControlFor<V> | ScalarControlFor<NonNull<V>>

/**
 * Controls for the members of an object-typed prop.
 *
 * Members are typed with {@link GroupMemberControlFor} rather than
 * {@link ControlFor}, which caps nesting at one level: an object inside an object
 * drives no control of its own and drops out, unless a scalar control derives it.
 * One level covers the case this exists for (a cva `variants` bag), and a deeper
 * tree is both harder to render legibly and more type instantiation than the
 * feature is worth.
 *
 * Each member is stripped of `null` and `undefined` for the same reason
 * {@link ControlFor} strips a prop a level up: `VariantProps` produces
 * `onSurface?: 'base' | 'raised' | null | undefined`, which matches no arm with
 * those in it and would silently leave the group empty.
 *
 * Members no control can drive are removed rather than mapped to `never`, the
 * same as {@link ControllableProps} does a level up.
 */
type ControlGroupFor<T> = {
  [K in keyof T as [GroupMemberControlFor<T[K]>] extends [never]
    ? never
    : K]?: GroupMemberControlFor<T[K]>
}

/**
 * A group with nothing in it is no group at all: the prop drops out of the schema
 * entirely, so a render-prop bag reports as "not a controllable prop" rather than
 * accepting `{}` and rejecting every key you then write inside it.
 */
type NonEmptyGroup<G> = [keyof G] extends [never] ? never : G

/**
 * The group an object-typed prop can be driven by, or `never` for an object no
 * props panel has any business editing.
 *
 * Reached only for a prop that no scalar control fits, so the arms above take
 * precedence: `ReactNode` includes `string`, so it stays a text control rather
 * than becoming a group over `ReactElement`'s members.
 *
 * Arrays and functions are excluded before the object test, since both extend
 * `object`. Without them a `ComponentType` prop would offer a control group over
 * a function's members.
 */
type ObjectControlFor<T> = unknown extends T
  ? never
  : [T] extends [readonly unknown[]]
    ? never
    : [IsCallable<T>] extends [false]
      ? [T] extends [object]
        ? NonEmptyGroup<ControlGroupFor<T>>
        : never
      : never

/** `T` without `null` and `undefined`. See {@link ControlFor} for why the arms differ on it. */
type NonNull<T> = Exclude<T, null | undefined>

/**
 * The single-level arms of {@link ControlFor}: a scalar control, a derived one,
 * or a group. Everything but a list, so it can also type a list's rows.
 */
type EntryControlFor<T> =
  | DerivedControlFor<T>
  | ScalarControlFor<NonNull<T>>
  | ([ScalarControlFor<NonNull<T>>] extends [never]
      ? ObjectControlFor<NonNull<T>>
      : never)

/**
 * What a row in a list's `default` may hold: the input values its `of` can
 * produce. A scalar for a scalar or derived row, and for an object item the
 * group's own keys, so a typo in a default row is an excess-property error.
 */
type ListRowDefaultFor<Item> =
  | string
  | number
  | boolean
  | ([ObjectControlFor<NonNull<Item>>] extends [never]
      ? never
      : { [K in keyof ControlGroupFor<NonNull<Item>>]?: string | number | boolean })

/**
 * The list an array-typed prop can be driven by, or `never` for anything else.
 *
 * The rows take the same arms the prop itself would if it were a single item,
 * minus a list: that is the one level below the list the schema allows.
 *
 * `any[]`, `unknown[]` and `never[]` are rejected as the other arms reject their
 * items.
 */
type ListControlFor<T> = [NonNull<T>] extends [readonly (infer Item)[]]
  ? unknown extends Item
    ? never
    : [Item] extends [never]
      ? never
      : {
          type: 'list'
          label?: string
          of: EntryControlFor<Item>
          default?: readonly ListRowDefaultFor<Item>[]
        }
  : never

/**
 * The controls a prop of type `T` can be driven by, or `never` when it can't be
 * driven by any of them: a single control for a scalar prop, a group of them for
 * an object prop, a list for an array prop, and for any prop a scalar control
 * that derives the value.
 *
 * `T` is the prop's type as declared, `null` and `undefined` included. The scalar
 * and object arms see it stripped of both: `VariantProps` produces `variant?:
 * 'a' | 'b' | null | undefined`, which matches no arm with those in it and would
 * drop out of the schema, and naming it then reports that it is not a prop of the
 * component, which it is. The derived arm sees it whole, because its `derive`
 * returns the prop's value and an optional prop takes `undefined` from it. `Exclude`
 * rather than `NonNullable<…>` so hover text and errors read as the author wrote
 * them: `'primary' | 'danger'`, not `NonNullable<'primary' | 'danger' | null>`.
 *
 * The object arm is a fallthrough rather than a plain union member so the scalar
 * arms keep their precedence over it by construction, which is what a
 * `ReactNode` prop depends on to stay a text control. The derived and list arms
 * need no such guard: each carries a `type` key, so neither is mistaken for a
 * group.
 */
export type ControlFor<T> = EntryControlFor<T> | ListControlFor<T>

/**
 * A component's props with React's own props dropped, each typed as declared.
 *
 * `key` is dropped because `Key` is `string | number | bigint`, which reaches
 * {@link ControlFor}'s last arm and would otherwise offer a text control on it.
 * `ref` needs no dropping — its type matches no arm — but is named alongside `key`
 * so the intent reads as "React's own props, not the component's API".
 */
type PropTypes<C extends ElementType> = {
  [K in keyof ComponentProps<C> as K extends 'key' | 'ref'
    ? never
    : K]: ComponentProps<C>[K]
}

/**
 * The controls schema a component can have: one optional entry per prop that a
 * control can actually drive, typed to the controls that suit that prop.
 *
 * Props that no control can drive are removed rather than mapped to `never`, so a
 * component that cannot meaningfully have a playground — one whose only prop is
 * `children`, say — carries no controllable props at all.
 */
export type ControllableProps<C extends ElementType> = {
  [K in keyof PropTypes<C> as [ControlFor<PropTypes<C>[K]>] extends [never]
    ? never
    : K]?: ControlFor<PropTypes<C>[K]>
}

/** The group arm of a prop's {@link ControlFor}: the one member without a `type` key. */
type GroupArm<G> = Exclude<G, { type: string }>

/** The rows a prop's list arm takes, or `never` when the prop takes no list. */
type ListRowsArm<G> = Extract<G, { type: 'list' }> extends { of: infer Of } ? Of : never

/**
 * Turns a key inside a control group that the prop does not have into an error
 * naming why.
 *
 * `G` is what {@link ControlFor} derived for the prop, `E` the entry the author
 * actually wrote. An entry carrying a `type` key is a control rather than a
 * group, so there is nothing to look inside: it is left unconstrained and the
 * entry's own type does the checking. A list is the exception: its `of` is
 * checked the same way, against the rows the prop's list arm takes, so a typo
 * inside a row schema names the key too.
 *
 * A group entry is also pinned to the group arm here, which is about the error
 * and not the verdict. {@link ControlFor} is a union, and the `options` mirror
 * {@link DeriveNarrowing} adds for inference gives every arm the group's member
 * keys, so when a member is wrong TypeScript finds each arm's member type
 * accepting it and reports at the group instead of descending to the member.
 * Intersecting the group arm makes every arm's member type the real one, and
 * the error lands on the member that caused it. The union's keys are the ones
 * its members share, which for a group is none, so `keyof` is read off the arm.
 */
type NoExtraGroupControls<G, E> = 'type' extends keyof E
  ? E extends { type: 'list'; of: infer Of }
    ? [ListRowsArm<G>] extends [never]
      ? unknown
      : { of?: NoExtraGroupControls<ListRowsArm<G>, Of> } & NoExtraDefaultRowKeys<
          GroupArm<ListRowsArm<G>>,
          E
        >
    : unknown
  : [GroupArm<G>] extends [never]
    ? Record<keyof E, 'not a control of this prop'>
    : GroupArm<G> &
        Record<Exclude<keyof E, keyof GroupArm<G>>, 'not a control of this prop'>

/** Every key of every member of a union, where `keyof` alone gives the shared ones. */
type AnyKeyOf<U> = U extends unknown ? keyof U : never

/**
 * Turns a key in a list's default rows that the row schema does not have into an
 * error naming it.
 *
 * Needed because the constraint alone cannot: a default row is checked against
 * the row type by plain assignability, which lets an extra key through. So the
 * keys no row may have are gathered across every default row and each row is
 * required to carry them with an error string as their type, which no literal
 * satisfies. Only for a group row; a scalar row's keys are a string's.
 */
type NoExtraDefaultRowKeys<Row, E> = [Row] extends [never]
  ? unknown
  : E extends { default: readonly (infer D)[] }
    ? {
        default?: readonly Record<
          Exclude<AnyKeyOf<D>, keyof Row>,
          'not a member of this list row'
        >[]
      }
    : unknown

/**
 * Turns a key that is not a controllable prop into an error naming why, at the
 * top level and inside a control group alike.
 *
 * This has to be applied in {@link controlsFor}'s parameter position rather than
 * left to its `S extends ControllableProps<C>` constraint. TypeScript skips
 * excess-property checking against an empty object type, so for exactly the
 * component this feature exists to catch — one with no controllable props, or an
 * object prop with no controllable members — a constraint alone lets any control
 * through with no error at all.
 *
 * Exported so {@link controlsFor} can reference it from its own module, not
 * because it is part of the public API; the barrels do not re-export it.
 */
export type NoExtraControls<C extends ElementType, S> = Record<
  Exclude<keyof S, keyof ControllableProps<C>>,
  'not a controllable prop of this component'
> & {
  [K in keyof S]?: K extends keyof ControllableProps<C>
    ? NoExtraGroupControls<NonNullable<ControllableProps<C>[K]>, S[K]>
    : unknown
}

/**
 * The `options` written for each top-level entry of a schema, read back off the
 * literal by inference. `O[K]` is the tuple for a select or radio, `unknown` for
 * anything else. See {@link DeriveNarrowing}.
 */
type ControlOptions<O> = { [K in keyof O]: { options?: O[K] } }

/**
 * {@link ControlOptions}, one level down, for the members of each group.
 *
 * Reverse-mapping reads members off every entry, a scalar control's own keys
 * included, and for a schema typed as {@link ControlSchema} those come out of the
 * control arms of the union. The inner keys are optional so a group entry, which
 * has none of them, still satisfies it.
 */
type GroupControlOptions<G> = {
  [K in keyof G]: { [M in keyof G[K]]?: { options?: G[K][M] } }
}

/**
 * {@link ControlOptions}, for the members of each list's row schema, when that
 * schema is a group. A scalar row schema is a member of the list entry itself and
 * so is already read by {@link GroupControlOptions}.
 */
type ListRowControlOptions<R> = {
  [K in keyof R]: { of?: { [M in keyof R[K]]?: { options?: R[K][M] } } }
}

/**
 * The narrowed `derive` for one control, given the options it was written with:
 * nothing at all unless those are an array.
 *
 * A function property, checked contravariantly, so a `derive` the author typed
 * narrower than the options beside it (`(name: 'globe') => …` under
 * `['globe', 'gauge']`) is rejected rather than handed an option it never accepts.
 */
type NarrowedDerive<Options> = Options extends readonly (infer V)[]
  ? { derive?: (value: V) => unknown }
  : unknown

/**
 * Types the parameter of every `derive` in a {@link controlsFor} schema from the
 * `options` written beside it, so `derive: (name) => …` on a select sees `name`
 * as the union of those options.
 *
 * A schema entry that holds a `derive` is not inferable as a whole until that
 * function has been typed, and typing it is what needs the options. So `O`, `G`
 * and `R` are inferred separately, by reverse-mapping {@link ControlOptions},
 * {@link GroupControlOptions} and {@link ListRowControlOptions} over the literal,
 * which read the `options` property alone (at the top level, in a group's
 * members, and in the members of a list's row group) and need nothing else. This
 * type then contributes the narrowed parameter when `derive` is contextually
 * typed, and is wrapped in `NoInfer` so that it is instantiated at that point
 * rather than inferred from.
 *
 * Every control kind other than select and radio types its parameter from its
 * own arm; this adds nothing for them, and nothing for a control that does not
 * derive.
 *
 * Only `controlsFor` carries it. Its schema constraint names the component's
 * props, and TypeScript resolves a property of an intersection from the
 * constituents that declare it. Under the index signature of
 * {@link ControlSchema} the entry's arms are not a declared property, so beside
 * these mapped types they drop out of the contextual type, and both the
 * parameter typing and the inference of the schema itself fail. `defineControls`
 * and `createPreview` therefore type a select's `derive` from {@link ControlDef}
 * alone, as `string`.
 *
 * A schema that arrives typed as `ControlSchema` rather than as a literal
 * reverse-maps to an `O` with a string index signature, one options type for
 * every entry, read off the select and radio arms. There is nothing to narrow
 * from there, and applying it to every entry would reject a boolean's `derive`,
 * so the narrowing switches off for it.
 *
 * Exported so `controlsFor` can reference it, not because it is part of the
 * public API; the barrels do not re-export it.
 */
export type DeriveNarrowing<O, G, R> = ControlOptions<O> &
  GroupControlOptions<G> &
  ListRowControlOptions<R> &
  NoInfer<
    string extends keyof O
      ? unknown
      : {
          [K in keyof O]?: NarrowedDerive<O[K]> &
            (K extends keyof G
              ? { [M in keyof G[K]]?: NarrowedDerive<G[K][M]> }
              : unknown) &
            (K extends keyof R
              ? { of?: { [M in keyof R[K]]?: NarrowedDerive<R[K][M]> } }
              : unknown)
        }
  >

/**
 * A preview's render function. `ReactNode`, not `ReactElement`, so fragments and
 * arrays are valid. The values arg is optional so an uncontrolled
 * `() => <Button/>` stays assignable.
 */
export type RenderFn = (values?: ControlValues) => ReactNode

export interface PreviewOptions {
  /** Overrides the label derived from the export name. */
  label?: string
  /** Editable controls, drawn in the props panel and fed to `render`. */
  controls?: ControlSchema
  render: RenderFn
}

/**
 * The branded value `createPreview` returns.
 *
 * As a React component it takes a single private props bag carrying the control
 * values, deliberately *not* `RenderFn`'s shape: if the values were the props
 * bag directly, control names would collide with `children`/`key`/`ref`.
 *
 * `render` is the function the preview mounts, exposed so the dev server can
 * register it with React Fast Refresh under the preview's export name. Typed to
 * accept any render function and to be called by nothing: it is a handle for
 * tooling, not part of the authoring API.
 */
export type Preview = ((props?: { controlValues?: ControlValues }) => ReactNode) & {
  [PREVIEW]: true
  label?: string
  controls?: ControlSchema
  render: (values: never) => ReactNode
}

/**
 * One preview, as read statically from a file's source at build time.
 *
 * Carries only what the nav tree needs, so the tree can be built without
 * evaluating any preview module. The module itself is fetched on demand through
 * {@link PreviewFile.load}, which is what keeps each preview in its own lazy
 * chunk rather than the initial bundle.
 */
export interface PreviewEntry {
  exportName: string
  /** An explicit string-literal label, or null to derive one from the name. */
  label: string | null
}

/**
 * The props a consumer's global `Provider` receives.
 *
 * `theme` is foundry's resolved mode, so a design-system provider can track
 * foundry's light/dark toggle.
 */
export interface FoundryProviderProps {
  children: ReactNode
  theme: 'light' | 'dark'
}

/**
 * A consumer's global provider, exported as `Provider` from `foundry.providers.tsx`.
 *
 * Foundry wraps every preview in it, so the app-wide React context a component
 * relies on (a design-system theme provider, a data client, i18n) reaches
 * previews the same way it reaches the real app.
 */
export type FoundryProvider = (props: FoundryProviderProps) => ReactNode

/**
 * One prop of the component a schema is bound to, as declared, for the panel to
 * show beside the control that drives it.
 *
 * Read at build time by the dev server, with the TypeScript checker, from the
 * `controlsFor` call a preview's `controls` came from. `type` is the type as the
 * author wrote it, alias names included.
 */
export interface PropDoc {
  /** The prop's name on the component, which is also the control's key. */
  name: string
  type: string
  optional: boolean
  /** The prop's JSDoc, when it has one. */
  description?: string
}

/** The docs for one preview's controls, keyed by control name. */
export type ControlDocs = Record<string, PropDoc>

/** One navigable preview: a leaf of the nav tree. */
export interface PreviewLeaf {
  /** Url path, built from the nav path and the export name. */
  id: string
  label: string
  /** The export name this leaf came from. Drives `id`, never the label. */
  exportName: string
  /** Lazily imports the module this preview lives in, for rendering on demand. */
  load: () => Promise<Record<string, unknown>>
  /**
   * Lazily fetches the docs for this preview's controls, when the dev server
   * could read them. Undefined for a preview whose schema binds no component.
   */
  docs?: () => Promise<ControlDocs | undefined>
}

/**
 * One group as declared in the user's config. Declaration order is display
 * order, so this is how authors control where a section sits in the shelf.
 */
export interface NavItem {
  label: string
  /**
   * `readonly` so a tree declared through `defineNav` or `as const` still satisfies this,
   * which is what lets {@link NavPathsOf} read literal labels off it. Nothing mutates a
   * declared tree; it is read to build {@link NavNode}s.
   */
  children?: readonly NavItem[]
}

/** A group in the nav tree. Nests to arbitrary depth. */
export interface NavNode {
  label: string
  /** Slash-delimited path from the root, e.g. `'Forms/Button'`. */
  path: string
  children: NavNode[]
  leaves: PreviewLeaf[]
}

/**
 * One discovered `.preview.tsx` file, as emitted by the previews virtual module.
 *
 * Everything the nav tree needs (the file's nav path and its previews, in source
 * order) is read off the source at build time, so discovery never evaluates a
 * preview module. `load` fetches the module on demand when a preview is actually
 * rendered, giving each file its own lazy chunk.
 */
export interface PreviewFile {
  /** Declared nav path, or null to derive one from the filename. */
  nav: string | null
  /** The file's previews, in the order they are written. */
  previews: PreviewEntry[]
  load: () => Promise<Record<string, unknown>>
  /**
   * Lazily fetches the file's control docs, keyed by export name. Its own chunk,
   * separate from `load`, so reading prop types never delays rendering a preview.
   */
  docs?: () => Promise<Record<string, ControlDocs>>
}
