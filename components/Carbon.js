import React from 'react'
import ReactDOM from 'react-dom'
import dynamic from 'next/dynamic'
import hljs from 'highlight.js/lib/core'
import debounce from 'lodash.debounce'
import ms from 'ms'

import highlightLanguages from '../lib/highlight-languages'
import { isUnityCSharp } from '../lib/unity-api/detect'

highlightLanguages.forEach(([name, language]) => hljs.registerLanguage(name, language))

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

class Carbon extends React.PureComponent {
  static defaultProps = {
    onChange: noop,
    onGutterClick: noop,
  }
  state = {}

  handleLanguageChange = debounce(
    (newCode, language) => {
      if (language === 'auto') {
        // try to set the language
        const detectedLanguage = hljs.highlightAuto(newCode).language
        const languageMode = searchLanguage(detectedLanguage)

        if (languageMode) {
          return languageMode.mime || languageMode.mode
        }

        return 'text'
      }

      const languageMode = searchLanguage(language)

      if (languageMode) {
        return languageMode.mime || languageMode.mode
      }

      return 'text'
    },
    ms('300ms'),
    {
      leading: true,
      trailing: true,
    }
  )

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
      this.setState({ selectionAt: this.currentSelection }, () => {
        this.currentSelection = null
      })
    } else {
      this.setState({ selectionAt: null })
    }
  }

  onSelectionChange = changes => {
    if (this.state.selectionAt) {
      const editor = this.editor || this.props.editorRef?.current?.editor
      if (!editor || !editor.doc) {
        return
      }

      if (changes.removeHighlight) {
        removeSelectionStyles(editor.doc, this.state.selectionAt)
      } else if (changes.backgroundColor != null) {
        removeSelectionStyles(editor.doc, this.state.selectionAt, SELECTION_HIGHLIGHT_CLASS)
        const css = `background-color: ${changes.backgroundColor} !important`
        markSelection(
          editor.doc,
          this.state.selectionAt.from,
          this.state.selectionAt.to,
          SELECTION_HIGHLIGHT_CLASS,
          css
        )
      } else if (changes.color != null) {
        removeSelectionStyles(editor.doc, this.state.selectionAt, SELECTION_ERROR_CLASS)
        const css = `color: ${changes.color} !important`
        markSelection(
          editor.doc,
          this.state.selectionAt.from,
          this.state.selectionAt.to,
          SELECTION_ERROR_CLASS,
          css
        )
      }
    }
  }

  render() {
    const config = { ...DEFAULT_SETTINGS, ...this.props.config }

    const requestedLanguage = config.language && config.language.toLowerCase()
    const unityCSharp = isUnityCSharp(this.props.children)
    const resolvedLanguageMode =
      requestedLanguage === 'auto' && unityCSharp
        ? 'text/x-csharp'
        : this.handleLanguageChange(this.props.children, requestedLanguage)
    const languageMode =
      resolvedLanguageMode === 'text/x-csharp' && unityCSharp
        ? 'unity-csharp'
        : resolvedLanguageMode

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
            <SelectionEditor onChange={this.onSelectionChange} />,
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
              padding: 18px 18px;
              padding-left: 12px;
              ${config.lineNumbers ? 'padding-left: 12px;' : ''} border-radius: 5px;
              font-family: '${DEFAULT_SETTINGS.fontFamily}', monospace !important;
              font-size: ${config.fontSize};
              line-height: ${config.lineHeight} !important;
              font-variant-ligatures: contextual;
              font-feature-settings: 'calt' 1;
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
              padding-right: 16px;
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
