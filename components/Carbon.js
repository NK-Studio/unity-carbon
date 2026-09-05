import React from 'react'
import ReactDOM from 'react-dom'
import dynamic from 'next/dynamic'

import { Spinner } from './Spinner'
import WindowControls from './WindowControls'
import WidthHandler from './WidthHandler'

import {
  COLORS,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
  LANGUAGE_MIME_HASH,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  FONT_STACK,
} from '../lib/constants'

const SelectionEditor = dynamic(() => import('./SelectionEditor'), {
  loading: () => null,
})
const CodeMirror = dynamic(() => import('react-codemirror2').then(module => module.Controlled), {
  ssr: false,
  loading: () => null,
})
const SELECTION_HIGHLIGHT_CLASS = 'selection-highlight'
const SELECTION_ERROR_CLASS = 'selection-error'

function searchLanguage(l) {
  return LANGUAGE_NAME_HASH[l] || LANGUAGE_MODE_HASH[l] || LANGUAGE_MIME_HASH[l]
}

function noop() {}

function comparePositions(a, b) {
  return a.line - b.line || a.ch - b.ch
}

function markSelection(doc, from, to, className, css) {
  return doc.markText(from, to, { className, css })
}

function removeSelectionStyles(doc, selection, className) {
  doc
    .findMarks(
      selection.from,
      selection.to,
      marker =>
        (!className &&
          [SELECTION_HIGHLIGHT_CLASS, SELECTION_ERROR_CLASS].includes(marker.className)) ||
        marker.className === className
    )
    .forEach(marker => {
      const range = marker.find()
      const css = marker.css
      const markerClassName = marker.className

      marker.clear()
      if (!range) {
        return
      }
      if (comparePositions(range.from, selection.from) < 0) {
        markSelection(doc, range.from, selection.from, markerClassName, css)
      }
      if (comparePositions(range.to, selection.to) > 0) {
        markSelection(doc, selection.to, range.to, markerClassName, css)
      }
    })
}

function hasSelectionStyle(doc, selection, className) {
  return (
    doc.findMarks(selection.from, selection.to, marker => marker.className === className).length > 0
  )
}

class Carbon extends React.PureComponent {
  static defaultProps = {
    onChange: noop,
    onGutterClick: noop,
  }
  state = {}

  handleLanguageChange = language => {
    const languageMode = searchLanguage(language)

    if (languageMode) {
      return languageMode.mime || languageMode.mode
    }

    return 'text'
  }

  onBeforeChange = (editor, meta, code) => {
    if (!this.props.readOnly) {
      this.props.onChange(code)
    }
  }

  onSelection = (ed, data) => {
    if (this.props.readOnly) {
      return
    }

    this.editor = ed
    const selection = data.ranges[0]
    if (
      selection.head.line === selection.anchor.line &&
      selection.head.ch === selection.anchor.ch
    ) {
      return (this.currentSelection = null)
    }
    if (selection.head.line + selection.head.ch > selection.anchor.line + selection.anchor.ch) {
      this.currentSelection = {
        from: selection.anchor,
        to: selection.head,
      }
    } else {
      this.currentSelection = {
        from: selection.head,
        to: selection.anchor,
      }
    }
  }

  onMouseUp = () => {
    if (this.currentSelection) {
      const selectionAt = this.currentSelection
      this.setState({ selectionAt, selectionStyles: this.readSelectionStyles(selectionAt) }, () => {
        this.currentSelection = null
      })
    } else {
      this.setState({ selectionAt: null, selectionStyles: null })
    }
  }

  // CodeMirror only re-measures the line-number gutter when the digit count
  // changes, so a font-size or line-height change leaves a stale gutter width
  // behind - the numbers then crowd (or drift away from) the code. refresh()
  // clears that cache and re-measures.
  componentDidUpdate(prevProps) {
    const prev = prevProps.config || {}
    const next = this.props.config || {}
    if (prev.fontSize !== next.fontSize || prev.lineHeight !== next.lineHeight) {
      this.refreshWhenFontApplied(next.fontSize)
    }
  }

  componentWillUnmount() {
    this.pendingRefresh = null
  }

  // styled-jsx swaps the rule asynchronously, so refreshing right away re-measures
  // the old font size. Poll until the new size has actually landed on the node, then
  // refresh - capped so a size we can never match cannot spin forever. Timers rather
  // than animation frames, so this still runs while the tab is hidden.
  refreshWhenFontApplied(fontSize, attempt = 0) {
    const token = (this.pendingRefresh = {})
    setTimeout(() => {
      if (this.pendingRefresh !== token) {
        return
      }
      // the CodeMirror instance hangs off its wrapper node; the React ref points at
      // next/dynamic's loadable wrapper, which does not forward it.
      const node = this.props.innerRef?.current?.querySelector('.CodeMirror')
      if (!node || !node.CodeMirror) {
        return
      }
      if (window.getComputedStyle(node).fontSize !== fontSize && attempt < 12) {
        this.refreshWhenFontApplied(fontSize, attempt + 1)
        return
      }
      this.pendingRefresh = null
      node.CodeMirror.refresh()
    }, 16)
  }

  getEditor() {
    return this.editor || this.props.editorRef?.current?.editor
  }

  // which styles the current selection already carries, so the toolbar buttons can
  // show themselves as active and toggle back off on a second click
  readSelectionStyles(selection) {
    const editor = this.getEditor()
    if (!editor || !editor.doc || !selection) {
      return null
    }
    return {
      highlight: hasSelectionStyle(editor.doc, selection, SELECTION_HIGHLIGHT_CLASS),
      error: hasSelectionStyle(editor.doc, selection, SELECTION_ERROR_CLASS),
    }
  }

  onSelectionChange = changes => {
    const selection = this.state.selectionAt
    if (!selection) {
      return
    }
    const editor = this.getEditor()
    if (!editor || !editor.doc) {
      return
    }

    const apply = (className, css) => {
      const active = hasSelectionStyle(editor.doc, selection, className)
      removeSelectionStyles(editor.doc, selection, className)
      // a second click on an already applied style clears it; changing the color
      // while the highlight is on repaints it instead of toggling it off
      if (!active || changes.keepActive) {
        markSelection(editor.doc, selection.from, selection.to, className, css)
      }
    }

    if (changes.backgroundColor != null) {
      apply(SELECTION_HIGHLIGHT_CLASS, `background-color: ${changes.backgroundColor} !important`)
    } else if (changes.color != null) {
      apply(SELECTION_ERROR_CLASS, `color: ${changes.color} !important`)
    }

    this.setState({ selectionStyles: this.readSelectionStyles(selection) })
  }

  render() {
    const config = { ...DEFAULT_SETTINGS, ...this.props.config }
    const fontSizePx = parseFloat(config.fontSize) || parseFloat(DEFAULT_SETTINGS.fontSize)
    const gutterGap = Math.round(fontSizePx * (16 / 14))
    const gutterMinWidth = Math.round(fontSizePx * (20 / 14))

    const requestedLanguage = config.language && config.language.toLowerCase()
    const resolvedLanguageMode = this.handleLanguageChange(requestedLanguage)
    // The Unity mode is a superset of clike C#: any C# snippet gets the Rider-style
    // colors, whether or not it references Unity APIs.
    const languageMode =
      resolvedLanguageMode === 'text/x-csharp' ? 'unity-csharp' : resolvedLanguageMode

    const options = {
      screenReaderLabel: 'Code editor',
      lineNumbers: config.lineNumbers,
      firstLineNumber: config.firstLineNumber,
      mode: languageMode || 'plaintext',
      theme: DEFAULT_SETTINGS.theme,
      scrollbarStyle: null,
      viewportMargin: Infinity,
      lineWrapping: true,
      smartIndent: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
      },
      readOnly: this.props.readOnly,
      showInvisibles: config.hiddenCharacters,
      autoCloseBrackets: true,
      autoCloseXmlDocComments: ['text/x-csharp', 'unity-csharp'].includes(languageMode),
    }
    const backgroundImage =
      (this.props.config.backgroundImage && this.props.config.backgroundImageSelection) ||
      this.props.config.backgroundImage

    const themeConfig = this.props.theme || DEFAULT_THEME

    const light = themeConfig && themeConfig.light

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    const selectionNode =
      !this.props.readOnly &&
      !!this.state.selectionAt &&
      document.getElementById('style-editor-button')

    return (
      <div className="section">
        <div
          ref={this.props.innerRef}
          id="export-container"
          className="export-container"
          onMouseUp={this.onMouseUp}
        >
          {this.props.loading ? (
            // TODO investigate removing these hard-coded values
            <div style={{ width: 876, height: 240 }}>
              <Spinner />
            </div>
          ) : (
            <div className="container">
              {config.windowControls ? (
                <WindowControls
                  titleBar={this.props.titleBar}
                  onTitleBarChange={this.props.onTitleBarChange}
                  theme={config.windowTheme}
                  code={this.props.children}
                  copyable={this.props.copyable}
                  light={light}
                />
              ) : null}
              <CodeMirror
                ref={this.props.editorRef}
                className={`CodeMirror__container window-theme__${config.windowTheme}`}
                value={this.props.children}
                options={options}
                onBeforeChange={this.onBeforeChange}
                onGutterClick={this.props.onGutterClick}
                onSelection={this.onSelection}
              />
              <div className="container-bg">
                <div className="white eliminateOnRender" />
                <div className="alpha eliminateOnRender" />
                <div className="bg" />
              </div>

              {/* TODO pass in this child as a prop to Carbon */}
              <WidthHandler
                innerRef={this.props.innerRef}
                onChange={this.props.updateWidth}
                onChangeComplete={this.props.updateWidthConfirm}
                paddingHorizontal={config.paddingHorizontal}
                paddingVertical={config.paddingVertical}
              />
            </div>
          )}
        </div>
        {selectionNode &&
          ReactDOM.createPortal(
            <SelectionEditor
              onChange={this.onSelectionChange}
              activeStyles={this.state.selectionStyles}
            />,
            // TODO: don't use portal?
            selectionNode
          )}
        <style jsx>
          {`
            .container {
              position: relative;
              min-width: ${config.widthAdjustment ? '90px' : 'auto'};
              max-width: ${config.widthAdjustment ? '1024px' : 'none'};
              ${config.widthAdjustment ? '' : `width: ${config.width}px;`}
              padding: ${config.paddingVertical} ${config.paddingHorizontal};
            }

            .container .container-bg {
              position: absolute;
              top: 0px;
              right: 0px;
              bottom: 0px;
              left: 0px;
            }

            .container .white {
              background: #fff;
              position: absolute;
              top: 0px;
              right: 0px;
              bottom: 0px;
              left: 0px;
            }

            .container .bg {
              ${this.props.config.backgroundMode === 'image'
                ? `background: url(${backgroundImage});
                    background-size: cover;
                    background-repeat: no-repeat;`
                : `background: ${this.props.config.backgroundColor || config.backgroundColor};
                    background-size: auto;
                    background-repeat: repeat;`}
              position: absolute;
              top: 0px;
              right: 0px;
              bottom: 0px;
              left: 0px;
            }

            .container .alpha {
              position: absolute;
              top: 0px;
              right: 0px;
              bottom: 0px;
              left: 0px;
              background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==);
            }

            .container :global(.CodeMirror-gutters) {
              background-color: unset;
              border-right: none;
            }

            .container :global(.CodeMirror__container) {
              min-width: inherit;
              position: relative;
              z-index: 1;
              border-radius: 5px;
              ${config.dropShadow
                ? `box-shadow: ${config.dropShadowOffsetX || '0px'} ${config.dropShadowOffsetY} ${
                    config.dropShadowBlurRadius
                  } rgba(0, 0, 0, 0.55)`
                : ''};
            }

            .container :global(.CodeMirror__container .CodeMirror) {
              height: auto;
              min-width: inherit;
              /* Horizontal padding scales with the font size so the framing looks
                 the same at every size; vertical stays fixed because the window
                 controls overlay is a fixed 48px. 18px / 12px at the 14px default. */
              padding: 18px 1.3em;
              padding-left: 0.85em;
              ${config.lineNumbers ? 'padding-left: 0.85em;' : ''} border-radius: 5px;
              font-family: ${FONT_STACK} !important;
              font-size: ${config.fontSize};
              line-height: ${config.lineHeight} !important;
              /* Contextual alternates and kerning are shaped per script run, and a run
                 mixing Hangul with ASCII is shaped differently from a pure Latin one in
                 Chromium - which nudged the two comment slashes apart on lines holding
                 Korean. Turning both off keeps every line on the mono grid. */
              font-variant-ligatures: none;
              font-feature-settings: 'calt' 0, 'liga' 0;
              font-kerning: none;
              user-select: none;
            }

            .container :global(.CodeMirror-scroll),
            .container :global(.CodeMirror-hscrollbar) {
              overflow: hidden !important;
            }

            .container :global(.window-theme__sharp > .CodeMirror) {
              border-radius: 0px;
            }

            .container :global(.window-theme__bw > .CodeMirror) {
              border: 2px solid ${COLORS.SECONDARY};
            }

            .container :global(.window-controls + .CodeMirror__container > .CodeMirror) {
              padding-top: 48px;
            }

            .container :global(.CodeMirror-linenumber) {
              cursor: pointer;
              /* Scale the gutter metrics with the font size so the number-to-code gap
                 keeps the same ratio at every size (16px and 20px at the 14px default).
                 These are resolved to px rather than left as em because CodeMirror
                 measures the gutter with a detached probe element, where em padding
                 measures wrong and the numbers end up overlapping the code. */
              padding-right: ${gutterGap}px;
              min-width: ${gutterMinWidth}px;
              line-height: ${config.lineHeight} !important;
            }

            .container :global(.CodeMirror-cursor) {
              visibility: ${this.props.readOnly ? 'hidden' : ''};
            }

            @media (max-width: 768px) {
              /* show cursor on mobile */
              .container :global([contenteditable='true']) {
                user-select: text;
              }
              .container {
                max-width: 480px;
              }
            }

            .section,
            .export-container {
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              overflow: hidden;
              max-width: 100%;
            }
          `}
        </style>
      </div>
    )
  }
}

let modesLoaded = false
function useModeLoader() {
  React.useEffect(() => {
    if (!modesLoaded) {
      // Load Codemirror add-ons
      require('../lib/custom/autoCloseBrackets')
      require('../lib/custom/autoCloseXmlDocComments')
      // Static requires keep removed languages out of the client bundle.
      require('codemirror/mode/clike/clike')
      require('codemirror/mode/css/css')
      require('codemirror/mode/xml/xml')
      require('codemirror/mode/javascript/javascript')
      require('codemirror/mode/htmlmixed/htmlmixed')
      require('codemirror/mode/jsx/jsx')
      require('codemirror/mode/swift/swift')
      require('../lib/custom/modes/unity-csharp')
      require('../lib/custom/modes/gitignore')
      require('../lib/custom/modes/gitattributes')
      modesLoaded = true
    }
  }, [])
}

function selectedLinesReducer(
  { prevLine, selected },
  { type, lineNumber, numLines, selectedLines }
) {
  const newState = {}

  switch (type) {
    case 'GROUP': {
      if (prevLine) {
        for (let i = Math.min(prevLine, lineNumber); i < Math.max(prevLine, lineNumber) + 1; i++) {
          newState[i] = selected[prevLine]
        }
      }
      break
    }
    case 'MULTILINE': {
      for (let i = 0; i < selectedLines.length; i++) {
        newState[selectedLines[i] - 1] = true
      }
      break
    }
    default: {
      for (let i = 0; i < numLines; i++) {
        if (i != lineNumber) {
          if (prevLine == null) {
            newState[i] = false
          }
        } else {
          newState[lineNumber] = selected[lineNumber] === true ? false : true
        }
      }
    }
  }

  return {
    selected: { ...selected, ...newState },
    prevLine: lineNumber,
  }
}

function useSelectedLines(props, editorRef) {
  const [state, dispatch] = React.useReducer(selectedLinesReducer, {
    prevLine: null,
    selected: {},
  })

  React.useEffect(() => {
    const editor = editorRef.current?.editor
    if (editor?.display?.view && Object.keys(state.selected).length > 0) {
      editor.display.view.forEach((line, i) => {
        if (line.text) {
          line.text.style.opacity = state.selected[i] === true ? 1 : 0.5
        }
        if (line.gutter) {
          line.gutter.style.opacity = state.selected[i] === true ? 1 : 0.5
        }
      })
    }
  }, [state.selected, props.children, props.config, editorRef])

  React.useEffect(() => {
    if (props.config.selectedLines) {
      dispatch({
        type: 'MULTILINE',
        selectedLines: props.config.selectedLines,
      })
    }
  }, [props.config.selectedLines])

  return React.useCallback(function onGutterClick(editor, lineNumber, gutter, e) {
    const numLines = editor.display.view.length
    const type = e.shiftKey ? 'GROUP' : 'LINE'
    dispatch({ type, lineNumber, numLines })
  }, [])
}

function useShowInvisiblesLoader() {
  React.useEffect(() => void require('cm-show-invisibles'), [])
}

function CarbonContainer(props, ref) {
  useModeLoader()
  useShowInvisiblesLoader()
  const editorRef = React.useRef(null)
  const onGutterClick = useSelectedLines(props, editorRef)

  return <Carbon {...props} innerRef={ref} editorRef={editorRef} onGutterClick={onGutterClick} />
}

export default React.forwardRef(CarbonContainer)
