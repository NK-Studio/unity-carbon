// `.gitignore` and `.gitattributes` share one pattern language: fnmatch globs plus git's
// own additions — `**` for "any number of directories", a leading/trailing `/` that anchors
// or restricts to directories, and backslash escapes for the characters git would otherwise
// read as syntax. Both modes route their pattern half through this tokenizer.

// CodeMirror aborts a mode whose token() returns without moving the stream, so every branch
// below consumes at least one character.
export function tokenizePattern(stream) {
  const ch = stream.next()

  // `\#`, `\!`, `\ ` — the escaped character is a literal, not syntax
  if (ch === '\\') {
    stream.next()
    return 'string-2'
  }

  // `**` matches across directories, `*` stops at the separator; both read as one token
  if (ch === '*') {
    stream.eat('*')
    return 'git-glob'
  }

  if (ch === '?') {
    return 'git-glob'
  }

  if (ch === '[') {
    return tokenizeCharacterClass(stream)
  }

  if (ch === '/') {
    return 'operator'
  }

  // a run of ordinary path characters, stopping before anything the branches above own
  stream.eatWhile(/[^\s\\*?[/]/)
  return 'variable'
}

// `[Ll]ibrary`, `[!a-z]`, `[^0-9]`. Called with the opening `[` already consumed.
function tokenizeCharacterClass(stream) {
  const afterBracket = stream.pos

  stream.eat(/[!^]/)
  // a `]` in the first position is a member of the class, not its terminator
  stream.eat(']')

  while (!stream.eol()) {
    if (stream.next() === ']') {
      return 'git-glob'
    }
  }

  // no closing bracket on the line: git reads the `[` as a literal. Give back everything
  // except that one character so the rest of the line still gets tokenized normally.
  stream.pos = afterBracket
  return 'variable'
}
