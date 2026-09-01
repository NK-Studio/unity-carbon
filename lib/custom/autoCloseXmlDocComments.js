import CodeMirror from 'codemirror'

const Pos = CodeMirror.Pos
const keyMap = { "'/'": handleSlash }

CodeMirror.defineOption('autoCloseXmlDocComments', false, function (cm, enabled, old) {
  if (old && old !== CodeMirror.Init) {
    cm.removeKeyMap(keyMap)
  }
  if (enabled) {
    cm.addKeyMap(keyMap)
  }
})

function handleSlash(cm) {
  if (cm.getOption('disableInput') || cm.getOption('readOnly')) {
    return CodeMirror.Pass
  }

  const selections = cm.listSelections()
  if (selections.length !== 1 || !selections[0].empty()) {
    return CodeMirror.Pass
  }

  const cursor = selections[0].head
  const line = cm.getLine(cursor.line)
  const match = /^(\s*)\/\/$/.exec(line)

  if (!match || cursor.ch !== line.length) {
    return CodeMirror.Pass
  }

  const indent = match[1]
  const lineSeparator = cm.lineSeparator() || '\n'
  const summary = ['/ <summary>', `${indent}/// `, `${indent}/// </summary>`].join(lineSeparator)

  cm.operation(() => {
    cm.replaceRange(summary, cursor, cursor, '+input')
    cm.setCursor(Pos(cursor.line + 1, indent.length + 4))
  })
}
