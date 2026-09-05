import CodeMirror from 'codemirror'
import { tokenizePattern } from './git-pattern'

// `.gitignore` has no keywords — a line is a comment, or a glob pattern with an optional
// leading `!`. Both markers only count in the first column, so the mode needs no state
// beyond what `stream.sol()` already tells it.
if (!CodeMirror.modes['gitignore']) {
  CodeMirror.defineMode('gitignore', () => ({
    token(stream) {
      if (stream.sol()) {
        if (stream.peek() === '#') {
          stream.skipToEnd()
          return 'comment'
        }
        // `!` re-includes a path an earlier pattern excluded
        if (stream.eat('!')) {
          return 'keyword'
        }
      }

      if (stream.eatSpace()) {
        return null
      }

      return tokenizePattern(stream)
    },
    lineComment: '#',
  }))
}

const gitignoreMode = 'gitignore'

export default gitignoreMode
