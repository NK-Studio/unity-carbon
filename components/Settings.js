import React from 'react'
import omitBy from 'lodash.omitby'
import { useKeyboardListener } from 'actionsack'

import ThemeSelect from './ThemeSelect'
import ListSetting from './ListSetting'
import AngleDial, { angleFromOffsets } from './AngleDial'
import Slider from './Slider'
import Input from './Input'
import Toggle from './Toggle'
import Popout, { managePopout } from './Popout'
import Button from './Button'
import MenuButton from './MenuButton'
import {
  COLORS,
  DEFAULT_SETTINGS,
  DEFAULT_WIDTHS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
} from '../lib/constants'
import { fileToJSON } from '../lib/util'
import SettingsIcon from './svg/Settings'

function KeyboardShortcut({ trigger, handle }) {
  useKeyboardListener(trigger, handle)
  return null
}

function WindowSettings({
  onChange,
  windowTheme,
  paddingHorizontal,
  paddingVertical,
  dropShadow,
  dropShadowBlurRadius,
  dropShadowOffsetX,
  dropShadowOffsetY,
  windowControls,
  widthAdjustment,
  width,
  onWidthChanging,
  onWidthChanged,
}) {
  const offsetX = parseFloat(dropShadowOffsetX) || 0
  const offsetY = parseFloat(dropShadowOffsetY) || 0
  const distance = Math.round(Math.hypot(offsetX, offsetY))

  // the angle is undefined at distance 0, so remember the last one the user picked
  const [lastAngle, setLastAngle] = React.useState(() => angleFromOffsets(offsetX, offsetY))
  const angle = distance === 0 ? lastAngle : angleFromOffsets(offsetX, offsetY)

  const applyPolar = (nextAngle, nextDistance) => {
    const radians = (nextAngle * Math.PI) / 180
    // sub-pixel precision, otherwise the angle can't survive the round trip
    // through the offsets it is derived from — 1° at distance 20 is 0.35px
    const round = value => Math.round(value * 1000) / 1000
    onChange('dropShadowOffsetX', `${round(-nextDistance * Math.cos(radians))}px`)
    onChange('dropShadowOffsetY', `${round(nextDistance * Math.sin(radians))}px`)
  }

  const handleAngleChange = nextAngle => {
    setLastAngle(nextAngle)
    applyPolar(nextAngle, distance)
  }

  const handleDistanceChange = value => applyPolar(angle, parseFloat(value) || 0)

  return (
    <div className="settings-content">
      <ThemeSelect
        selected={windowTheme || 'none'}
        windowControls={windowControls}
        onChange={onChange}
      />
      <div className="row">
        <Slider
          label="여백 (세로)"
          value={paddingVertical}
          maxValue={200}
          onChange={onChange.bind(null, 'paddingVertical')}
        />
        <Slider
          label="여백 (가로)"
          value={paddingHorizontal}
          onChange={onChange.bind(null, 'paddingHorizontal')}
          onMouseDown={onWidthChanging}
          onMouseUp={onWidthChanged}
        />
      </div>
      <Toggle label="그림자" enabled={dropShadow} onChange={onChange.bind(null, 'dropShadow')} />
      {dropShadow && (
        <div className="drop-shadow-options">
          <AngleDial label="(각도)" angle={angle} onChange={handleAngleChange} />
          <div className="row">
            <Slider label="(거리)" value={distance} onChange={handleDistanceChange} />
            <Slider
              label="(번짐)"
              value={dropShadowBlurRadius}
              onChange={onChange.bind(null, 'dropShadowBlurRadius')}
            />
          </div>
        </div>
      )}
      <Toggle
        label="너비 자동 조절"
        enabled={widthAdjustment}
        onChange={onChange.bind(null, 'widthAdjustment')}
      />
      {!widthAdjustment && (
        <div className="row settings-row width-row">
          <Input
            label="너비"
            type="number"
            value={width}
            min={DEFAULT_WIDTHS.minWidth}
            max={DEFAULT_WIDTHS.maxWidth}
            onChange={e => onChange('width', e.target.value)}
            width="50%"
          />
        </div>
      )}
      <style jsx>
        {`
          .width-row {
            justify-content: space-between;
            padding: 8px 12px 8px 8px;
          }

          .row > :global(div:first-child) {
            border-right: 1px solid ${COLORS.SECONDARY};
          }

          .drop-shadow-options :global(.slider-bg),
          .drop-shadow-options :global(label) {
            opacity: 0.5;
          }

          .settings-content :global(.settings-row:focus-within) {
            outline: -webkit-focus-ring-color auto 4px;
          }
        `}
      </style>
    </div>
  )
}

function EditorSettings({
  onChange,
  themes,
  theme,
  size,
  lineHeight,
  lineNumbers,
  firstLineNumber,
  hiddenCharacters,
  onWidthChanging,
  onWidthChanged,
}) {
  return (
    <div className="settings-content">
      <div className="theme-row">
        <ListSetting
          title="테마"
          items={themes}
          selected={theme}
          onChange={onChange.bind(null, 'theme')}
        >
          {item => <span className="theme-name">{item.name}</span>}
        </ListSetting>
      </div>
      <Slider
        label="크기"
        value={size}
        minValue={MIN_FONT_SIZE}
        maxValue={MAX_FONT_SIZE}
        step={0.5}
        editable
        onChange={onChange.bind(null, 'fontSize')}
        onMouseDown={onWidthChanging}
        onMouseUp={onWidthChanged}
      />
      <Slider
        label="줄 간격"
        value={lineHeight}
        minValue={90}
        maxValue={250}
        unit="%"
        onChange={onChange.bind(null, 'lineHeight')}
      />
      <Toggle label="줄 번호" enabled={lineNumbers} onChange={onChange.bind(null, 'lineNumbers')} />
      {lineNumbers && (
        <div className="row settings-row first-line-number-row">
          <Input
            label="시작 줄 번호"
            type="number"
            value={firstLineNumber}
            min={0}
            onChange={e => onChange('firstLineNumber', Number(e.target.value))}
            width="50%"
          />
        </div>
      )}
      <Toggle
        label="공백 문자 표시"
        enabled={hiddenCharacters}
        onChange={onChange.bind(null, 'hiddenCharacters')}
      />
      <style jsx>
        {`
          .first-line-number-row {
            padding: 8px 12px 8px 8px;
          }

          .theme-row {
            border-bottom: 1px solid ${COLORS.SECONDARY};
          }

          .theme-row :global(.theme-name) {
            font-size: 12px;
          }
        `}
      </style>
    </div>
  )
}

const resetButtonStyle = { borderTop: `1px solid ${COLORS.SECONDARY}` }

function MiscSettings({ format, reset, applyConfig, settings }) {
  const input = React.useRef(null)
  let download
  try {
    download = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings))}`
  } catch (error) {
    // pass
  }
  return (
    <div className="settings-content">
      <div className="row">
        <input
          hidden
          ref={input}
          type="file"
          accept=".json"
          onChange={async e => {
            const json = await fileToJSON(e.target.files[0])
            if (json) {
              applyConfig(json)
            }
          }}
        />
        <Button
          center
          style={{ borderRight: `1px solid ${COLORS.SECONDARY}` }}
          onClick={() => input.current.click()}
        >
          설정 불러오기
        </Button>
        <Button center Component="a" href={download} download="carbon-config.json">
          설정 내보내기
        </Button>
      </div>
      <Button center onClick={format} style={resetButtonStyle}>
        코드 정렬
      </Button>
      <Button center color={COLORS.RED} onClick={reset} style={resetButtonStyle}>
        설정 초기화
      </Button>
      <style jsx>
        {`
          .row {
            flex: 1;
          }
          .settings-content {
            display: flex;
            flex-direction: column;
          }
          .settings-content :global(a) {
            display: flex;
            flex: 1;
            user-drag: none;
          }
        `}
      </style>
    </div>
  )
}

const settingButtonStyle = {
  width: '40px',
  height: '100%',
}

const invalidSetting = (v, k) =>
  // Allow highlights in config exports
  !(Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, k) || k === 'highlights')

class Settings extends React.PureComponent {
  state = {
    selectedMenu: 'Window',
    widthChanging: false,
  }

  settingsRef = React.createRef()
  menuRef = React.createRef()

  selectMenu = selectedMenu => () => this.setState({ selectedMenu })

  handleWidthChanging = () => {
    const rect = this.settingsRef.current.getBoundingClientRect()
    this.settingPosition = { top: rect.bottom, left: rect.left }
    this.setState({ widthChanging: true })
  }

  handleWidthChanged = () => this.setState({ widthChanging: false })

  handleChange = (key, value) => {
    this.props.onChange(key, value)
  }

  handleOpenAndFocus = () => {
    this.props.toggleVisibility()
    if (!this.props.isVisible) {
      this.menuRef.current.focus()
    }
  }

  handleReset = () => {
    this.props.resetDefaultSettings()
  }

  getSettingsFromProps = () => omitBy(this.props, invalidSetting)

  renderContent = () => {
    switch (this.state.selectedMenu) {
      case 'Window':
        return (
          <WindowSettings
            onChange={this.handleChange}
            onWidthChanging={this.handleWidthChanging}
            onWidthChanged={this.handleWidthChanged}
            windowTheme={this.props.windowTheme}
            paddingHorizontal={this.props.paddingHorizontal}
            paddingVertical={this.props.paddingVertical}
            dropShadow={this.props.dropShadow}
            dropShadowBlurRadius={this.props.dropShadowBlurRadius}
            dropShadowOffsetX={this.props.dropShadowOffsetX}
            dropShadowOffsetY={this.props.dropShadowOffsetY}
            windowControls={this.props.windowControls}
            widthAdjustment={this.props.widthAdjustment}
            width={this.props.width}
          />
        )
      case 'Editor':
        return (
          <EditorSettings
            onChange={this.handleChange}
            themes={this.props.themes}
            theme={this.props.theme}
            onWidthChanging={this.handleWidthChanging}
            onWidthChanged={this.handleWidthChanged}
            size={this.props.fontSize}
            lineHeight={this.props.lineHeight}
            lineNumbers={this.props.lineNumbers}
            firstLineNumber={this.props.firstLineNumber}
            hiddenCharacters={this.props.hiddenCharacters}
          />
        )
      case 'Misc': {
        const settings = this.getSettingsFromProps()
        return (
          <MiscSettings
            format={this.props.format}
            reset={this.handleReset}
            applyConfig={this.props.applyConfig}
            settings={settings}
          />
        )
      }
      default:
        return null
    }
  }

  render() {
    const { selectedMenu, widthChanging } = this.state
    const { isVisible, toggleVisibility } = this.props

    return (
      <div className="settings-container" ref={this.settingsRef}>
        <KeyboardShortcut trigger="⌘-/" handle={this.handleOpenAndFocus} />
        <KeyboardShortcut trigger="⇧-⌘-\" handle={this.handleReset} />
        <Button
          title="설정 메뉴"
          border
          center
          selected={isVisible}
          style={settingButtonStyle}
          onClick={toggleVisibility}
        >
          <SettingsIcon />
        </Button>
        <Popout
          pointerLeft="15px"
          hidden={!isVisible}
          style={{
            position: widthChanging ? 'fixed' : 'absolute',
            width: '316px',
            top: widthChanging ? this.settingPosition.top : 'initial',
            left: widthChanging ? this.settingPosition.left : 'initial',
          }}
        >
          <div className="settings-bottom">
            <div className="settings-menu" ref={this.menuRef} tabIndex={-1}>
              <MenuButton
                name="Window"
                label="창"
                select={this.selectMenu}
                selected={selectedMenu}
              />
              <MenuButton
                name="Editor"
                label="에디터"
                select={this.selectMenu}
                selected={selectedMenu}
              />
              <MenuButton
                name="Misc"
                label="기타"
                select={this.selectMenu}
                selected={selectedMenu}
              />
            </div>
            {this.renderContent()}
          </div>
        </Popout>
        <style jsx>
          {`
            .settings-container {
              position: relative;
            }

            .settings-bottom {
              display: flex;
            }

            .settings-menu {
              display: flex;
              flex-direction: column;
              flex: 0 0 96px;
              background-color: ${COLORS.DARK_GRAY};
            }

            .settings-bottom :global(.settings-content) {
              width: 100%;
              border-left: 2px solid ${COLORS.SECONDARY};
            }

            .settings-bottom :global(.settings-content > div:not(:first-child)) {
              border-top: solid 1px ${COLORS.SECONDARY};
            }
          `}
        </style>
      </div>
    )
  }
}

export default managePopout(Settings)
