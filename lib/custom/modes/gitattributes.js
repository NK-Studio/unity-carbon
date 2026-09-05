import CodeMirror from 'codemirror'
import { tokenizePattern } from './git-pattern'

// git's own attributes, plus the linguist/GitLab ones that turn up in most real files
const KNOWN_ATTRIBUTES = new Set([
  'binary',
  'conflict-marker-size',
  'delta',
  'diff',
  'encoding',
  'eol',
  'export-ignore',
  'export-subst',
  'filter',
  'gitlab-language',
  'ident',
  'merge',
  'text',
  'whitespace',
  'working-tree-encoding',
])
// `linguist-language`, `linguist-generated`, `linguist-vendored`, … — too many to list
const linguistAttributePattern = /^linguist-/
// `[attr]binary -diff -merge -text` defines a macro standing in for a set of attributes
const macroPattern = /^\[attr\]/
const attributeNamePattern = /^[^\s=]+/

function isKnownAttribute(name) {
  return KNOWN_ATTRIBUTES.has(name) || linguistAttributePattern.test(name)
}

function tokenizeAttribute(stream, state) {
  // `filter=lfs`, `eol=lf` — whatever follows the `=` is the attribute's value
  if (state.expectValue) {
    stream.eatWhile(/\S/)
    state.expectValue = false
    return 'string'
  }

  if (stream.eat('=')) {
    state.expectValue = true
    return 'operator'
  }

  // `-text` unsets an attribute, `!text` leaves it unspecified. Only meaningful as the
  // first character of the token — `export-ignore` keeps its hyphen.
  if (stream.eat(/[-!]/)) {
    return 'operator'
  }

  const name = stream.match(attributeNamePattern)
  if (!name) {
    stream.next()
    return null
  }

  return isKnownAttribute(name[0]) ? 'keyword' : 'def'
}

// A line is `<pattern> <attribute>…`, so the mode has to remember which half it is in.
if (!CodeMirror.modes['gitattributes']) {
  CodeMirror.defineMode('gitattributes', () => ({
    startState() {
      return { section: 'pattern', expectValue: false }
    },
    token(stream, state) {
      if (stream.sol()) {
        state.section = 'pattern'
        state.expectValue = false

        if (stream.eatSpace() && stream.eol()) {
          return null
        }

        if (stream.peek() === '#') {
          stream.skipToEnd()
          return 'comment'
        }

        if (stream.match(macroPattern)) {
          state.section = 'macro'
          return 'meta'
        }
      } else if (stream.eatSpace()) {
        // the pattern is the first field on the line, so the first space ends it
        if (state.section === 'pattern') {
          state.section = 'attributes'
        }
        state.expectValue = false
        return null
      }

      if (state.section === 'macro') {
        stream.eatWhile(/\S/)
        state.section = 'attributes'
        return 'def'
      }

      if (state.section === 'pattern') {
        return tokenizePattern(stream)
      }

      return tokenizeAttribute(stream, state)
    },
    lineComment: '#',
  }))
}

const gitattributesMode = 'gitattributes'

export default gitattributesMode
