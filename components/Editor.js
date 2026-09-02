// Theirs
import React from 'react'
import Dropzone from 'dropperx'
import debounce from 'lodash.debounce'
import dynamic from 'next/dynamic'

// Ours
import ApiContext from './ApiContext'
import Dropdown from './Dropdown'
import Settings from './Settings'
import Toolbar from './Toolbar'
import Overlay from './Overlay'
import BackgroundSelect from './BackgroundSelect'
import Carbon from './Carbon'
import ExportMenu from './ExportMenu'
import CopyImageButton from './CopyImageButton'
import GlobalHighlights from './Themes/GlobalHighlights'
import LanguageIcon from './svg/Language'
import {
  LANGUAGES,
  LANGUAGE_MIME_HASH,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
  DEFAULT_EXPORT_SIZE,
  COLORS,
  EXPORT_SIZES_HASH,
  DEFAULT_CODE,
  DEFAULT_SETTINGS,
  DEFAULT_LANGUAGE,
  DEFAULT_EXPORT_FILENAME,
  DEFAULT_THEME,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  THEMES,
  THEMES_HASH,
} from '../lib/constants'
import { getRouteState } from '../lib/routing'
import { getSettings, unescapeHtml, formatCode, omit } from '../lib/util'
import domtoimage from '../lib/dom-to-image'

const languageIcon = <LanguageIcon />

const SnippetToolbar = dynamic(() => import('./SnippetToolbar'), {
  loading: () => null,
})

const getConfig = omit(['code', 'titleBar', 'theme', 'highlights', 'fontUrl'])
const unsplashPhotographerCredit = /\n\n\/\/ Photo by.+?on Unsplash/

class Editor extends React.Component {
  static contextType = ApiContext

  state = {
    ...DEFAULT_SETTINGS,
    ...this.props.snippet,
    fontFamily: DEFAULT_SETTINGS.fontFamily,
    fontUrl: null,
    loading: true,
  }

  async componentDidMount() {
    this.registerZoomListener()

    const { queryState } = getRouteState(this.props.router)

    const newState = {
      // IDEA: we could create an interface for loading this config, so that it looks identical
      // whether config is loaded from localStorage, gist, or even something like IndexDB
      // Load options from gist or localStorage
      ...(this.props.snippet ? null : getSettings(localStorage)),
      // and then URL params
      ...queryState,
      loading: false,
    }

    // Makes sure the slash in 'application/X' is decoded
    if (newState.language) {
      newState.language = unescapeHtml(newState.language)
    }

    const supportedLanguage =
      LANGUAGE_NAME_HASH[newState.language] ||
      LANGUAGE_MIME_HASH[newState.language] ||
      LANGUAGE_MODE_HASH[newState.language]
    if (newState.language && !supportedLanguage) {
      newState.language = 'text'
    }

    if (!THEMES_HASH[newState.theme]) {
      newState.theme = DEFAULT_THEME.id
    }
    newState.highlights = null
    newState.fontFamily = DEFAULT_SETTINGS.fontFamily
    newState.fontUrl = null
    delete newState.preset

    this.setState(newState)
  }

  componentWillUnmount() {
    if (this.unregisterZoomListener) {
      this.unregisterZoomListener()
    }
  }

  carbonNode = React.createRef()
  editorNode = React.createRef()

  // ctrl (Windows/Linux) or cmd (macOS) + wheel resizes the code, the way it does in
  // an IDE. The listener has to be a native, non-passive one: React routes wheel
  // events through a passive root listener, where preventDefault is ignored and the
  // browser would zoom the whole page instead.
  registerZoomListener = () => {
    const node = this.editorNode.current
    if (!node) {
      return
    }
    node.addEventListener('wheel', this.onWheel, { passive: false })
    this.unregisterZoomListener = () => node.removeEventListener('wheel', this.onWheel)
  }

  onWheel = event => {
    if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) {
      return
    }
    event.preventDefault()
    // trackpads report fractional deltas, so only the direction is meaningful here
    const direction = event.deltaY < 0 ? 1 : -1
    const current = parseFloat(this.state.fontSize) || parseFloat(DEFAULT_SETTINGS.fontSize)
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, current + direction))
    if (next !== current) {
      this.updateSetting('fontSize', `${next}px`)
    }
  }

  getTheme = () => THEMES_HASH[this.state.theme] || DEFAULT_THEME

  onUpdate = debounce(updates => this.props.onUpdate(updates), 750, {
    trailing: true,
    leading: true,
  })

  sync = () => this.onUpdate(this.state)

  updateState = updates => this.setState(updates, this.sync)

  updateCode = code => this.updateState({ code })
  updateTitleBar = titleBar => this.updateState({ titleBar })
  updateWidth = width => this.setState({ widthAdjustment: false, width })

  getCarbonImage = async (
    {
      format,
      squared = this.state.squaredImage,
      exportSize = (EXPORT_SIZES_HASH[this.state.exportSize] || DEFAULT_EXPORT_SIZE).value,
    } = { format: 'blob' }
  ) => {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load(
        `400 ${this.state.fontSize} "${DEFAULT_SETTINGS.fontFamily}"`,
        `${this.state.code || DEFAULT_CODE}\n한글 English`
      )
    }

    const node = this.carbonNode.current

    const width = node.offsetWidth * exportSize
    const height = squared ? node.offsetWidth * exportSize : node.offsetHeight * exportSize

    const config = {
      style: {
        transform: `scale(${exportSize})`,
        transformOrigin: 'top left',
        background: squared ? this.state.backgroundColor : 'none',
        alignItems: 'start',
        justifyContent: 'start',
      },
      filter: n => {
        if (n.className) {
          const className = String(n.className)
          if (className.includes('eliminateOnRender')) {
            return false
          }
          if (className.includes('CodeMirror-cursors')) {
            return false
          }
        }
        return true
      },
      width,
      height,
    }

    if (format === 'svg') {
      return domtoimage
        .toSvg(node, config)
        .then(dataURL =>
          dataURL
            .replace(/&nbsp;/g, '&#160;')
            // https://github.com/tsayen/dom-to-image/blob/fae625bce0970b3a039671ea7f338d05ecb3d0e8/src/dom-to-image.js#L551
            .replace(/%23/g, '#')
            .replace(/%0A/g, '\n')
            // https://stackoverflow.com/questions/7604436/xmlparseentityref-no-name-warnings-while-loading-xml-into-a-php-file
            .replace(/&(?!#?[a-z0-9]+;)/g, '&amp;')
        )
        .then(uri => uri.slice(uri.indexOf(',') + 1))
        .then(data => new Blob([data], { type: 'image/svg+xml' }))
    }

    return domtoimage.toBlob(node, config)
  }

  exportImage = (format = 'blob', options = {}) => {
    const link = document.createElement('a')

    const prefix = options.filename || this.state.name || DEFAULT_EXPORT_FILENAME

    return this.getCarbonImage({ format })
      .then(blob => window.URL.createObjectURL(blob))
      .then(url => {
        if (!options.open) {
          link.download = `${prefix}.${format === 'svg' ? 'svg' : 'png'}`
        }
        if (
          // isFirefox
          window.navigator.userAgent.indexOf('Firefox') !== -1 &&
          window.navigator.userAgent.indexOf('Chrome') === -1
        ) {
          link.target = '_blank'
        }
        link.href = url
        document.body.appendChild(link)
        link.click()
        link.remove()
      })
  }

  showToast = children =>
    this.props.setToasts({ type: 'SET', toasts: [{ id: Date.now(), children, timeout: 3000 }] })

  showCopyUnsupported = () => this.showToast('이 브라우저는 이미지 클립보드 복사를 지원하지 않아요')

  copyImage = () =>
    this.getCarbonImage({ format: 'blob' })
      .then(blob =>
        navigator.clipboard.write([
          new window.ClipboardItem({
            [blob.type]: blob,
          }),
        ])
      )
      .then(() => this.showToast('클립보드 복사 완료!'))
      .catch(error => {
        console.error(error)
        this.showToast('클립보드 복사에 실패했어요')
      })

  updateSetting = (key, value) => {
    this.updateState({ [key]: value })
  }

  resetDefaultSettings = () => {
    this.updateState(DEFAULT_SETTINGS)
    this.props.onReset()
  }

  onDrop = ([file]) => {
    if (file.type.split('/')[0] === 'image') {
      this.updateState({
        backgroundImage: file.content,
        backgroundImageSelection: null,
        backgroundMode: 'image',
      })
    } else {
      this.updateState({ code: file.content, language: DEFAULT_LANGUAGE })
    }
  }

  updateLanguage = language => {
    if (language) {
      this.updateSetting('language', language.mime || language.mode)
    }
  }

  updateBackground = ({ photographer, ...changes } = {}) => {
    if (photographer) {
      this.updateState(({ code = DEFAULT_CODE }) => ({
        ...changes,
        code:
          code.replace(unsplashPhotographerCredit, '') +
          `\n\n// Photo by ${photographer.name} on Unsplash`,
      }))
    } else {
      this.updateState(changes)
    }
  }

  applyConfig = config => {
    const settings = { ...config }
    delete settings.id
    delete settings.custom
    delete settings.icon
    delete settings.preset
    delete settings.highlights
    delete settings.fontFamily
    delete settings.fontUrl
    this.updateState({
      ...settings,
      theme: THEMES_HASH[settings.theme] ? settings.theme : DEFAULT_THEME.id,
      highlights: null,
      fontFamily: DEFAULT_SETTINGS.fontFamily,
      fontUrl: null,
    })
  }

  format = () =>
    formatCode(this.state.code)
      .then(this.updateCode)
      .catch(() => {
        // create toast here in the future
      })

  handleSnippetCreate = () =>
    this.context.snippet
      .create(this.state)
      .then(data => this.props.setSnippet(data))
      .then(() =>
        this.props.setToasts({
          type: 'SET',
          toasts: [{ children: 'Snippet created', timeout: 3000 }],
        })
      )

  handleSnippetUpdate = () =>
    this.context.snippet.update(this.props.snippet.id, this.state).then(() =>
      this.props.setToasts({
        type: 'SET',
        toasts: [{ children: 'Snippet saved', timeout: 3000 }],
      })
    )

  handleSnippetDelete = () =>
    this.context.snippet
      .delete(this.props.snippet.id)
      .then(() => this.props.setSnippet(null))
      .then(() =>
        this.props.setToasts({
          type: 'SET',
          toasts: [{ children: 'Snippet deleted', timeout: 3000 }],
        })
      )

  render() {
    const {
      language,
      backgroundColor,
      backgroundImage,
      backgroundMode,
      code,
      exportSize,
      titleBar,
    } = this.state

    const config = getConfig(this.state)

    const theme = this.getTheme()

    return (
      <div className="editor" ref={this.editorNode}>
        <Toolbar>
          <Dropdown
            title="Language"
            icon={languageIcon}
            selected={
              LANGUAGE_NAME_HASH[language] ||
              LANGUAGE_MIME_HASH[language] ||
              LANGUAGE_MODE_HASH[language] ||
              LANGUAGE_MODE_HASH[DEFAULT_LANGUAGE]
            }
            list={LANGUAGES}
            onChange={this.updateLanguage}
          />
          <div className="toolbar-second-row">
            <div className="setting-buttons">
              <BackgroundSelect
                onChange={this.updateBackground}
                mode={backgroundMode}
                color={backgroundColor}
                image={backgroundImage}
                carbonRef={this.carbonNode.current}
              />
              <Settings
                {...config}
                themes={THEMES}
                theme={theme.id}
                onChange={this.updateSetting}
                resetDefaultSettings={this.resetDefaultSettings}
                format={this.format}
                applyConfig={this.applyConfig}
              />
              <CopyImageButton
                copyImage={this.copyImage}
                onUnsupported={this.showCopyUnsupported}
              />
            </div>
            <div id="style-editor-button" />
            <div className="export-buttons">
              <ExportMenu
                onChange={this.updateSetting}
                exportImage={this.exportImage}
                exportSize={exportSize}
              />
            </div>
          </div>
        </Toolbar>

        <GlobalHighlights theme={theme} />

        <Dropzone accept="image/*, text/*, application/*" onDrop={this.onDrop}>
          {({ canDrop }) => (
            <Overlay
              isOver={canDrop}
              title={`Drop your file here to import ${canDrop ? '✋' : '✊'}`}
            >
              {/*key ensures Carbon's internal language state is updated when it's changed by Dropdown*/}
              <Carbon
                key={language}
                ref={this.carbonNode}
                config={{ ...this.state, theme: theme.id, highlights: null }}
                onChange={this.updateCode}
                updateWidth={this.updateWidth}
                updateWidthConfirm={this.sync}
                loading={this.state.loading}
                theme={theme}
                titleBar={titleBar}
                onTitleBarChange={this.updateTitleBar}
              >
                {code != null ? code : DEFAULT_CODE}
              </Carbon>
            </Overlay>
          )}
        </Dropzone>
        <SnippetToolbar
          state={this.state}
          snippet={this.props.snippet}
          onCreate={this.handleSnippetCreate}
          onDelete={this.handleSnippetDelete}
          onUpdate={this.handleSnippetUpdate}
          name={config.name}
          onChange={this.updateSetting}
        />
        <style jsx>
          {`
            .editor {
              background: ${COLORS.BLACK};
              border: 3px solid ${COLORS.SECONDARY};
              border-radius: 8px;
              padding: 16px;
            }

            .export-buttons,
            .setting-buttons {
              display: flex;
              height: 40px;
            }
            .export-buttons {
              margin-left: auto;
            }
            .toolbar-second-row {
              display: flex;
              flex: 1 1 auto;
            }
            .setting-buttons > :global(div) {
              margin-right: 0.5rem;
            }

            #style-editor-button {
              display: flex;
              align-items: center;
            }
            @media (max-width: 768px) {
              .toolbar-second-row {
                display: block;
              }
              #style-editor-button {
                margin-top: 0.5rem;
              }
            }
          `}
        </style>
      </div>
    )
  }
}

Editor.defaultProps = {
  onUpdate: () => {},
  onReset: () => {},
}

export default Editor
