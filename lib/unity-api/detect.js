import {
  UNITY_ATTRIBUTES,
  UNITY_ENUM_MEMBERS,
  UNITY_MEMBERS,
  UNITY_METHODS,
  UNITY_NAMESPACES,
  UNITY_TYPES,
} from './index'

const UNITY_SCORE_THRESHOLD = 2
const UNITY_BASE_TYPES = new Set([
  'Component',
  'Editor',
  'EditorWindow',
  'MonoBehaviour',
  'NetworkBehaviour',
  'PropertyDrawer',
  'ScriptableObject',
  'ScriptableRendererFeature',
  'ScriptableRenderPass',
  'StateMachineBehaviour',
])

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const namespacePattern = Array.from(UNITY_NAMESPACES)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join('|')
const baseTypePattern = Array.from(UNITY_BASE_TYPES).map(escapeRegExp).join('|')
const attributePattern = Array.from(UNITY_ATTRIBUTES).map(escapeRegExp).join('|')

const namespaceEvidence = new RegExp(
  `\\b(?:using\\s+(?:static\\s+)?|global::)?(?:${namespacePattern})(?:\\.[A-Za-z_][A-Za-z0-9_]*)*\\b`
)
const baseTypeEvidence = new RegExp(
  `:\\s*(?:(?:global::)?[A-Za-z_][A-Za-z0-9_.]*\\.)?(?:${baseTypePattern})\\b`
)
const attributeEvidence = attributePattern
  ? new RegExp(`\\[\\s*(?:(?:[A-Za-z_][A-Za-z0-9_.]*)\\.)?(?:${attributePattern})(?:Attribute)?\\b`)
  : null

// Removes strings, character literals, and comments before evidence scoring. The
// returned text keeps newlines so regexes cannot accidentally join two lines.
export function stripCSharpTrivia(code) {
  let output = ''
  let index = 0
  let state = 'code'
  let quote = null
  let verbatim = false

  while (index < code.length) {
    const current = code[index]
    const next = code[index + 1]

    if (state === 'line-comment') {
      if (current === '\n') {
        state = 'code'
        output += '\n'
      } else {
        output += ' '
      }
      index += 1
      continue
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        output += '  '
        index += 2
        state = 'code'
      } else {
        output += current === '\n' ? '\n' : ' '
        index += 1
      }
      continue
    }

    if (state === 'string') {
      if (verbatim && current === '"' && next === '"') {
        output += '  '
        index += 2
      } else if (current === quote && (verbatim || code[index - 1] !== '\\')) {
        output += ' '
        index += 1
        state = 'code'
      } else {
        output += current === '\n' ? '\n' : ' '
        index += 1
      }
      continue
    }

    if (current === '/' && next === '/') {
      output += '  '
      index += 2
      state = 'line-comment'
    } else if (current === '/' && next === '*') {
      output += '  '
      index += 2
      state = 'block-comment'
    } else if (current === '@' && next === '"') {
      output += '  '
      index += 2
      state = 'string'
      quote = '"'
      verbatim = true
    } else if ((current === '$' && next === '"') || current === '"' || current === "'") {
      if (current === '$') {
        output += '  '
        index += 2
        quote = '"'
      } else {
        output += ' '
        index += 1
        quote = current
      }
      state = 'string'
      verbatim = false
    } else {
      output += current
      index += 1
    }
  }

  return output
}

function collectIdentifiers(code) {
  return code.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || []
}

export function getUnityEvidenceScore(code) {
  if (!code) return 0

  const source = stripCSharpTrivia(code)
  if (
    namespaceEvidence.test(source) ||
    baseTypeEvidence.test(source) ||
    (attributeEvidence && attributeEvidence.test(source))
  ) {
    return UNITY_SCORE_THRESHOLD
  }

  const matches = new Set()
  for (const identifier of collectIdentifiers(source)) {
    if (
      UNITY_TYPES.has(identifier) ||
      UNITY_METHODS.has(identifier) ||
      UNITY_MEMBERS.has(identifier) ||
      UNITY_ENUM_MEMBERS.has(identifier)
    ) {
      matches.add(identifier)
      if (matches.size >= UNITY_SCORE_THRESHOLD) return matches.size
    }
  }

  return matches.size
}

export const isUnityCSharp = code => getUnityEvidenceScore(code) >= UNITY_SCORE_THRESHOLD
