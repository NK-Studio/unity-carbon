import CodeMirror from 'codemirror'
import { classifyUnityIdentifier, UNITY_ENUMS } from '../../unity-api'

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/
const ignoredStylePattern = /(?:^|\s)(?:comment|string|string-2|meta)(?:\s|$)/
// clike gives a declared type the same `def` style it gives a method, but Rider
// paints `class Foo` like any other type — look behind on the line to tell them apart
const typeDeclarationPattern = /\b(class|struct|interface|enum|record)\s+$/
// Rider paints value types and interfaces apart from classes, so they keep their specific color
const declaredValueTypeStyles = {
  struct: 'unity-struct',
  enum: 'unity-enum',
  interface: 'unity-interface',
}
// `KeyCode.Space`: the qualifier names the enum, so whatever follows the dot is one of its
// values — no need for the registry to carry all 300 of them
const qualifierPattern = /(?:^|[^\w.])([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*$/
// `[Obsolete]` sitting on an enum value is an attribute, not another value
const attributePositionPattern = /\[\s*(?:[A-Za-z_][A-Za-z0-9_]*\s*\.\s*)*$/
const memberAccessPattern = /\.\s*$/
// every segment of `namespace Foo.Bar` and `using Foo.Bar;` is a namespace to Rider,
// whether or not it is a registered Unity one
const namespacePattern =
  /(?:\bnamespace|^\s*using(?:\s+static)?)\s+(?:[A-Za-z_][A-Za-z0-9_]*\s*\.\s*)*$/
// clike's C# keyword list predates these contextual keywords, so they arrive as identifiers
const contextualKeywords = new Set([
  'where',
  'record',
  'nameof',
  'when',
  'init',
  'required',
  'scoped',
  'unmanaged',
  'notnull',
])
// `T`, `TKey`, `TValue`, `U` — the universal C# convention for type parameters
const typeParameterPattern = /^(?:[A-Z]|T[A-Z][A-Za-z0-9]*)$/
// `_instance`, `m_Keys`, `s_Device`, `k_Limit` — field naming conventions. A usage is
// indistinguishable from a local without scope analysis, so the name is all we have.
const fieldPattern = /^(?:_|[mskt]_)[A-Za-z0-9_]*$/
// a property declaration is `modifiers Type Name` with a body, not a `;` or a `(`:
// `int Anima { get; set; }`, `int Foo => …`, or the brace opening on the next line
const memberDeclarationPattern =
  /^\s*(?:(?:public|private|protected|internal|static|readonly|new|override|virtual|abstract|sealed|extern|unsafe|required|partial)\s+)*[\w][\w.<>[\],?\s]*\s$/
const propertyBodyPattern = /^\s*(?:\{|=>|$)/
// C# forbids access modifiers on locals, so one of these makes a declaration a field
const memberOnlyModifierPattern =
  /\b(?:public|private|protected|internal|static|readonly|event|volatile|required)\b/
const fieldBodyPattern = /^\s*(?:[;,]|=(?!>))/
// positions that can only hold a type: `new Foo`, `class A : Foo`, `where T : Foo`
const typePositionPattern = new RegExp(
  '(?:\\bnew\\s+' +
    '|\\bwhere\\s+[A-Za-z_][A-Za-z0-9_]*\\s*:\\s*' +
    '|\\b(?:class|struct|interface|record)\\s+[A-Za-z_][A-Za-z0-9_]*(?:\\s*<[^>]*>)?\\s*:\\s*)' +
    '(?:[A-Za-z_][A-Za-z0-9_.]*(?:<[^>]*>)?\\s*,\\s*)*$'
)

// methods are followed by `(` (with optional type arguments `<...>`)
const methodCallPattern = /^\s*(?:<[^>]*>\s*)?\(/
// Event subscriptions take a method group without parentheses. Treat the right-hand
// identifier as a method and remember it for later declarations and usages.
const eventHandlerPositionPattern = /(?:\+=|-=)\s*$/

// `enum Foo` opens a body whose names are all values; nested braces inside an initializer
// keep the depth honest so the body ends on the matching `}`
function trackEnumBody(token, state) {
  if (token === '{') {
    if (state.unityEnumDepth > 0) state.unityEnumDepth += 1
    else if (state.unityPendingEnum) state.unityEnumDepth = 1
    state.unityPendingEnum = false
  } else if (token === '}' && state.unityEnumDepth > 0) {
    state.unityEnumDepth -= 1
  }
}

function isEnumValue(identifier, before, baseStyle, state) {
  if (baseStyle === 'keyword') return false

  const qualifier = qualifierPattern.exec(before)
  if (qualifier) {
    const name = qualifier[1]
    return UNITY_ENUMS.has(name) || state.unityValueTypes.get(name) === 'unity-enum'
  }

  return (
    state.unityEnumDepth > 0 &&
    !memberAccessPattern.test(before) &&
    !attributePositionPattern.test(before)
  )
}

if (!CodeMirror.modes['unity-csharp']) {
  CodeMirror.defineMode('unity-csharp', config => {
    const csharp = CodeMirror.getMode(config, 'text/x-csharp')

    return {
      ...csharp,
      startState(...args) {
        const state = csharp.startState(...args)
        // CodeMirror's generic copyState copies this by reference, so a field
        // declared on one line stays recognizable on every later line
        state.unityMembers = new Set()
        state.unityEvents = new Set()
        state.unityMethods = new Set()
        state.unityTypes = new Set()
        // declared struct and enum names, mapped to the style each one keeps
        state.unityValueTypes = new Map()
        // brace depth inside an `enum { … }` body, where every name is a value
        state.unityEnumDepth = 0
        state.unityPendingEnum = false
        return state
      },
      token(stream, state) {
        const baseStyle = csharp.token(stream, state)
        const identifier = stream.current()
        const ignored = baseStyle && ignoredStylePattern.test(baseStyle)

        if (!ignored) trackEnumBody(identifier, state)

        if (!identifierPattern.test(identifier) || ignored) {
          return baseStyle
        }

        // clike hands unknown identifiers back as `variable`
        if ((!baseStyle || baseStyle === 'variable') && contextualKeywords.has(identifier)) {
          return 'keyword'
        }

        const before = stream.string.slice(0, stream.start)
        const declaration = typeDeclarationPattern.exec(before)
        let unityStyle
        if (declaration) {
          const valueTypeStyle = declaredValueTypeStyles[declaration[1]]
          if (valueTypeStyle) {
            state.unityValueTypes.set(identifier, valueTypeStyle)
            state.unityPendingEnum = valueTypeStyle === 'unity-enum'
            unityStyle = valueTypeStyle
          } else {
            state.unityTypes.add(identifier)
            unityStyle = 'unity-declared-type'
          }
        } else if (baseStyle !== 'keyword' && namespacePattern.test(before)) {
          // `using var x = …` and `using (…)` keep their keyword style and fall through
          unityStyle = 'unity-namespace'
        } else if (isEnumValue(identifier, before, baseStyle, state)) {
          unityStyle = 'unity-enum-member'
        } else {
          unityStyle = classifyUnityIdentifier(identifier)
          if (!unityStyle && baseStyle !== 'keyword') {
            const after = stream.string.slice(stream.pos)
            const declaresMember =
              memberDeclarationPattern.test(before) &&
              (propertyBodyPattern.test(after) ||
                (memberOnlyModifierPattern.test(before) && fieldBodyPattern.test(after)))
            const declaresEvent = declaresMember && /\bevent\b/.test(before)

            if (state.unityValueTypes.has(identifier)) {
              unityStyle = state.unityValueTypes.get(identifier)
            } else if (
              typePositionPattern.test(before) ||
              typeParameterPattern.test(identifier) ||
              state.unityTypes.has(identifier)
            ) {
              unityStyle = 'unity-declared-type'
            } else if (declaresEvent) {
              state.unityEvents.add(identifier)
              unityStyle = 'unity-event'
            } else if (state.unityEvents.has(identifier)) {
              unityStyle = 'unity-event'
            } else if (declaresMember) {
              state.unityMembers.add(identifier)
              unityStyle = 'unity-member'
            } else if (
              methodCallPattern.test(after) ||
              eventHandlerPositionPattern.test(before) ||
              state.unityMethods.has(identifier)
            ) {
              state.unityMethods.add(identifier)
              unityStyle = 'unity-method'
            } else if (fieldPattern.test(identifier) || state.unityMembers.has(identifier)) {
              unityStyle = 'unity-member'
            }
          }
        }
        return unityStyle ? [baseStyle, unityStyle].filter(Boolean).join(' ') : baseStyle
      },
    }
  })
}

const unityCSharpMode = 'unity-csharp'

export default unityCSharpMode
