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
 * One editable control on a preview, drawn as an input in the props panel.
 *
 * `options` is `readonly` so a schema declared `as const` or through
 * {@link defineControls} or {@link controlsFor} keeps its literal option types,
 * which lets a select's value narrow to the union of its options rather than
 * plain `string`.
 */
export type ControlDef =
  | { type: 'text'; default?: string }
  | { type: 'boolean'; default?: boolean }
  | { type: 'select'; options: readonly string[]; default?: string }
  | { type: 'radio'; options: readonly string[]; default?: string }
  | { type: 'number'; default?: number; min?: number; max?: number; step?: number }
  | { type: 'range'; default?: number; min?: number; max?: number; step?: number }
  | { type: 'color'; default?: string }

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

/**
 * One entry in a schema: a control, or a group of controls for an object prop.
 *
 * The two are told apart structurally, by whether `type` holds a string. A
 * control always carries one and a group's own values are controls, so no marker
 * property is needed at runtime or in the types.
 */
export type ControlEntry = ControlDef | ControlGroup

export type ControlSchema = Record<string, ControlEntry>

/**
 * The value type a single control resolves to. A select/radio narrows to the
 * union of its options when those options are literal, else `string`.
 */
export type ControlValue<D extends ControlDef> = D extends { type: 'boolean' }
  ? boolean
  : D extends { type: 'number' | 'range' }
    ? number
    : D extends { type: 'select' | 'radio'; options: readonly (infer O)[] }
      ? O
      : string

/** The values object for one control group: one value per member control. */
export type ControlGroupValues<G extends ControlGroup> = {
  [K in keyof G]: ControlValue<G[K]>
}

/**
 * The value a single schema entry resolves to: a scalar for a control, a nested
 * object for a group.
 *
 * `E` is naked so a union of entries distributes, which is what keeps an
 * unparameterized {@link ControlValues} meaningful. `Extract` rather than a bare
 * `E` because {@link ControlValue} and {@link ControlGroupValues} are
 * constrained, and a conditional's true branch does not narrow a type parameter
 * enough to satisfy one.
 */
type ControlEntryValue<E> = E extends ControlDef
  ? ControlValue<Extract<E, ControlDef>>
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
 * Controls for the members of an object-typed prop.
 *
 * Members are typed with {@link ScalarControlFor} rather than {@link ControlFor},
 * which caps nesting at one level: an object inside an object drives no control
 * and drops out. One level covers the case this exists for (a cva `variants`
 * bag), and a deeper tree is both harder to render legibly and more type
 * instantiation than the feature is worth.
 *
 * `Exclude<…, null | undefined>` for the same reason {@link PropTypes} does it a
 * level up: `VariantProps` produces `onSurface?: 'base' | 'raised' | null |
 * undefined`, which matches no arm with those in it and would silently leave the
 * group empty.
 *
 * Members no control can drive are removed rather than mapped to `never`, the
 * same as {@link ControllableProps} does a level up.
 */
type ControlGroupFor<T> = {
  [K in keyof T as [ScalarControlFor<Exclude<T[K], null | undefined>>] extends [never]
    ? never
    : K]?: ScalarControlFor<Exclude<T[K], null | undefined>>
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

/**
 * The controls a prop of type `T` can be driven by, or `never` when it can't be
 * driven by any of them: a single control for a scalar prop, a group of them for
 * an object prop.
 *
 * Written as a fallthrough rather than another arm so the scalar arms keep their
 * precedence over the object one by construction, which is what a `ReactNode`
 * prop depends on to stay a text control.
 */
export type ControlFor<T> = [ScalarControlFor<T>] extends [never]
  ? ObjectControlFor<T>
  : ScalarControlFor<T>

/**
 * A component's props with `undefined` and `null` stripped, and React's own props
 * dropped.
 *
 * `-?` and `Exclude` rather than `NonNullable<…>` so hover text and errors read as
 * the author wrote them: `'primary' | 'danger'`, not
 * `NonNullable<'primary' | 'danger' | null>`. Stripping `null` is load-bearing
 * rather than cosmetic: without it `variant?: 'a' | 'b' | null` matches no arm of
 * {@link ControlFor} and disappears from the schema, and naming it then reports
 * that it is not a prop of the component, which it is.
 *
 * `key` is dropped because `Key` is `string | number | bigint`, which reaches
 * {@link ControlFor}'s last arm and would otherwise offer a text control on it.
 * `ref` needs no dropping — its type matches no arm — but is named alongside `key`
 * so the intent reads as "React's own props, not the component's API".
 */
type PropTypes<C extends ElementType> = {
  [K in keyof ComponentProps<C> as K extends 'key' | 'ref' ? never : K]-?: Exclude<
    ComponentProps<C>[K],
    null
  >
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

/**
 * Turns a key inside a control group that the prop does not have into an error
 * naming why.
 *
 * `G` is the group {@link ControlFor} derived for the prop, `E` the entry the
 * author actually wrote. An entry carrying a `type` key is a control rather than
 * a group, so there is nothing to look inside: it is left unconstrained and the
 * entry's own type does the checking.
 */
type NoExtraGroupControls<G, E> = 'type' extends keyof E
  ? unknown
  : Record<Exclude<keyof E, keyof G>, 'not a control of this prop'>

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
 */
export type Preview = ((props?: { controlValues?: ControlValues }) => ReactNode) & {
  [PREVIEW]: true
  label?: string
  controls?: ControlSchema
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

/** One navigable preview: a leaf of the nav tree. */
export interface PreviewLeaf {
  /** Url path, built from the nav path and the export name. */
  id: string
  label: string
  /** The export name this leaf came from. Drives `id`, never the label. */
  exportName: string
  /** Lazily imports the module this preview lives in, for rendering on demand. */
  load: () => Promise<Record<string, unknown>>
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
}
