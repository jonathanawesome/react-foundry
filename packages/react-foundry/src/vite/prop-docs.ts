import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { ControlDocs, PropDoc } from '@react-foundry/core'
import type ts from 'typescript'

/** The compiler API, loaded at runtime. `typescript` is the consumer's, never bundled. */
type TS = typeof ts

/**
 * The docs a file's previews can show: per preview export, per control key, the
 * prop it drives as declared on the component.
 */
export type FileDocs = Record<string, ControlDocs>

export interface PropDocsService {
  /** Docs for one preview file, or nothing for a file that binds no schema to a component. */
  docsFor(file: string): FileDocs
}

/**
 * Loads the consumer's `typescript`, falling back to the one next to foundry
 * itself (a workspace, or a hoisted install). Null when neither resolves, which
 * is a JavaScript project: it has no prop types to show, and nothing here runs.
 */
function loadTypeScript(root: string): TS | null {
  for (const from of [join(root, 'package.json'), import.meta.url]) {
    try {
      return createRequire(from)('typescript') as TS
    } catch {
      // Try the next location.
    }
  }
  return null
}

/**
 * The consumer's compiler options, from the nearest tsconfig above the root, so
 * a component's props resolve the way their own editor resolves them. A project
 * with no tsconfig gets what a React project would have set, and `jsx` is always
 * set: without it a `.tsx` module does not resolve at all, and every preview is
 * one.
 */
function compilerOptions(ts: TS, root: string): ts.CompilerOptions {
  const defaults: ts.CompilerOptions = {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
    strict: true,
  }

  const configPath = ts.findConfigFile(root, ts.sys.fileExists)
  const fromConfig = configPath
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(configPath, ts.sys.readFile).config,
        ts.sys,
        dirname(configPath)
      ).options
    : {}

  return { ...defaults, ...fromConfig, noEmit: true, skipLibCheck: true }
}

/**
 * Creates the service that reads prop docs off preview files, or null when the
 * project has no TypeScript to read them with.
 *
 * Built on a language service rather than a one-shot program, so the first
 * request pays for building the program over the preview files and their
 * imports (a second or two with React's types in the graph) and the rest reuse
 * it, re-checking only what changed. `getFiles` is asked for the root files on
 * every request, so a preview added since the service was created is in the
 * program by the time its docs are wanted.
 */
export function createPropDocsService(
  root: string,
  getFiles: () => string[]
): PropDocsService | null {
  const ts = loadTypeScript(root)
  if (!ts) return null

  const options = compilerOptions(ts, root)

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: getFiles,
    getScriptVersion: (file) => {
      try {
        return String(statSync(file).mtimeMs)
      } catch {
        return '0'
      }
    },
    getScriptSnapshot: (file) =>
      existsSync(file)
        ? ts.ScriptSnapshot.fromString(readFileSync(file, 'utf-8'))
        : undefined,
    getCurrentDirectory: () => root,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (settings) => ts.getDefaultLibFilePath(settings),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  }

  const service = ts.createLanguageService(host, ts.createDocumentRegistry())

  return {
    docsFor(file) {
      const program = service.getProgram()
      const source = program?.getSourceFile(file)
      if (!program || !source) return {}

      return extractFileDocs(ts, program.getTypeChecker(), source)
    },
  }
}

/**
 * Reads every `export const X = createPreview({ controls })` in a file, follows
 * `controls` to the `controlsFor(Component, schema)` it came from, and documents
 * each schema key from the component's props.
 *
 * The same authoring convention the previews parser enforces, read from the
 * syntax tree here rather than by regex: a preview is an exported const, and
 * its `controls` is a `controlsFor` call, a name bound to one, or a spread of
 * one inside another. `defineControls` binds no component, so a preview built
 * on it documents nothing.
 */
export function extractFileDocs(
  ts: TS,
  checker: ts.TypeChecker,
  source: ts.SourceFile
): FileDocs {
  const docs: FileDocs = {}

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    if (!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
      continue

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
      const call = unwrap(ts, declaration.initializer)
      if (!isCallTo(ts, call, 'createPreview')) continue

      const options = call.arguments[0]
      if (!options || !ts.isObjectLiteralExpression(options)) continue

      const controls = propertyValue(ts, options, 'controls')
      if (!controls) continue

      const binding = resolveControlsFor(ts, checker, controls)
      if (!binding) continue

      const propDocs = docsForBinding(ts, checker, binding.component, binding.keys)
      if (propDocs) docs[declaration.name.text] = propDocs
    }
  }

  return docs
}

/** A schema's component and its keys, once `controls` has been followed to a `controlsFor` call. */
interface Binding {
  component: ts.Expression
  keys: string[]
}

/**
 * Follows a `controls` expression to the `controlsFor` call behind it.
 *
 * Through a name (`controls: buttonControls`), including one imported from
 * another file, and through a spread (`controlsFor(Button, { ...buttonControls,
 * variant })`), where the outer call names the component and the keys come from
 * both. Anything else, an inline schema or a `defineControls` call, binds no
 * component.
 */
function resolveControlsFor(
  ts: TS,
  checker: ts.TypeChecker,
  expr: ts.Expression,
  depth = 0
): Binding | undefined {
  if (depth > 8) return undefined
  const node = unwrap(ts, expr)

  if (isCallTo(ts, node, 'controlsFor')) {
    const [component, schema] = node.arguments
    if (!component || !schema) return undefined
    return { component, keys: schemaKeys(ts, checker, schema, depth) }
  }

  if (ts.isIdentifier(node)) {
    const initializer = initializerOf(ts, checker, node)
    return initializer
      ? resolveControlsFor(ts, checker, initializer, depth + 1)
      : undefined
  }

  return undefined
}

/**
 * The keys a schema expression declares, spreads included. Read from the syntax
 * rather than the type so a schema still reads when foundry's own types cannot
 * be resolved from where the file sits.
 */
function schemaKeys(
  ts: TS,
  checker: ts.TypeChecker,
  schema: ts.Expression,
  depth: number
): string[] {
  const node = unwrap(ts, schema)
  if (depth > 8) return []

  if (ts.isObjectLiteralExpression(node)) {
    const keys: string[] = []
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spread = resolveControlsFor(ts, checker, property.expression, depth + 1)
        if (spread) keys.push(...spread.keys)
        else keys.push(...schemaKeys(ts, checker, property.expression, depth + 1))
        continue
      }
      const name = property.name
      if (name && (ts.isIdentifier(name) || ts.isStringLiteral(name)))
        keys.push(name.text)
    }
    return [...new Set(keys)]
  }

  if (ts.isIdentifier(node)) {
    const bound = resolveControlsFor(ts, checker, node, depth + 1)
    if (bound) return bound.keys
    const initializer = initializerOf(ts, checker, node)
    return initializer ? schemaKeys(ts, checker, initializer, depth + 1) : []
  }

  return []
}

/**
 * Documents each key from the component's props. Undefined when the component's
 * props cannot be read at all, such as an intrinsic element given as a string,
 * so the preview shows the control definition instead of an empty entry.
 */
function docsForBinding(
  ts: TS,
  checker: ts.TypeChecker,
  component: ts.Expression,
  keys: string[]
): ControlDocs | undefined {
  const props = propsTypeOf(checker, component)
  if (!props) return undefined

  const docs: ControlDocs = {}
  for (const key of keys) {
    const prop = props.getProperty(key)
    if (!prop) continue
    docs[key] = documentProp(ts, checker, prop, component)
  }
  return docs
}

/** The props type of a component expression: the first parameter of its call or construct signature. */
function propsTypeOf(
  checker: ts.TypeChecker,
  component: ts.Expression
): ts.Type | undefined {
  const type = checker.getTypeAtLocation(component)
  const signature = type.getCallSignatures()[0] ?? type.getConstructSignatures()[0]
  const param = signature?.getParameters()[0]
  if (!param) return undefined
  return checker.getTypeOfSymbolAtLocation(param, component)
}

/**
 * One prop, as declared. The type text is what the author wrote when the
 * declaration has a type node, alias names and all, and the checker's rendering
 * of the type otherwise (a mapped type's member, say), minus the `undefined` an
 * optional prop carries implicitly.
 */
function documentProp(
  ts: TS,
  checker: ts.TypeChecker,
  prop: ts.Symbol,
  at: ts.Node
): PropDoc {
  const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0
  const declared = prop.declarations?.find(
    (d): d is ts.PropertySignature | ts.PropertyDeclaration =>
      (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d)) && d.type !== undefined
  )

  let type: string
  if (declared?.type) {
    type = declared.type.getText()
  } else {
    const text = checker.typeToString(
      checker.getTypeOfSymbolAtLocation(prop, at),
      undefined,
      ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
    )
    type = optional
      ? text.replace(/^undefined \| /, '').replace(/ \| undefined$/, '')
      : text
  }

  const description = ts
    .displayPartsToString(prop.getDocumentationComment(checker))
    .trim()

  return {
    name: prop.name,
    type,
    optional,
    ...(description ? { description } : {}),
  }
}

/** The initializer an identifier was declared with, following an import to its source. */
function initializerOf(
  ts: TS,
  checker: ts.TypeChecker,
  identifier: ts.Identifier
): ts.Expression | undefined {
  let symbol = checker.getSymbolAtLocation(identifier)
  if (symbol && symbol.flags & ts.SymbolFlags.Alias)
    symbol = checker.getAliasedSymbol(symbol)
  const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0]
  return declaration && ts.isVariableDeclaration(declaration)
    ? declaration.initializer
    : undefined
}

/** The value of a named property of an object literal, shorthand included. */
function propertyValue(
  ts: TS,
  object: ts.ObjectLiteralExpression,
  name: string
): ts.Expression | undefined {
  for (const property of object.properties) {
    if (!property.name || !ts.isIdentifier(property.name) || property.name.text !== name)
      continue
    if (ts.isPropertyAssignment(property)) return property.initializer
    if (ts.isShorthandPropertyAssignment(property)) return property.name
  }
  return undefined
}

/** Steps through parentheses and `as`/`satisfies` to the expression they wrap. */
function unwrap(ts: TS, expr: ts.Expression): ts.Expression {
  let node = expr
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    node = node.expression
  }
  return node
}

function isCallTo(ts: TS, node: ts.Node, name: string): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === name
  )
}
