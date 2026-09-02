import React from 'react'
import { useKeyboardListener } from 'actionsack'
import Popout from './Popout'
import Button from './Button'
import ColorPicker from './ColorPicker'
import { COLORS } from '../lib/constants'

const DEFAULT_HIGHLIGHT_COLOR = '#4b4310'
const ERROR_TEXT_COLOR = '#ED5A44'
// the presets range from near-black olive to pastel, so the label has to follow the fill
function readableTextColor(hex) {
  const value = String(hex).replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map(character => character + character)
          .join('')
      : value
  const [r, g, b] = [0, 2, 4].map(offset => parseInt(full.slice(offset, offset + 2), 16) / 255)
  const channel = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  return luminance > 0.4 ? COLORS.BLACK : COLORS.SECONDARY
}

function SelectionEditor({ onChange, activeStyles }) {
  const [open, setOpen] = React.useState(false)
  const [color, setColor] = React.useState(DEFAULT_HIGHLIGHT_COLOR)

  useKeyboardListener('Escape', () => setOpen(false))

  const highlightActive = !!(activeStyles && activeStyles.highlight)
  const highlightTextColor = readableTextColor(color)
  const errorActive = !!(activeStyles && activeStyles.error)

  const toggleHighlight = () => onChange({ backgroundColor: color })
  const toggleErrorColor = () => onChange({ color: ERROR_TEXT_COLOR })
  const handleColorChange = value => {
    setColor(value.hex)
    // picking a color keeps the highlight on instead of toggling it off
    onChange({ backgroundColor: value.hex, keepActive: true })
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="highlighter">
        <div className="controls">
          <Button
            className={`apply-highlight${highlightActive ? ' active' : ''}`}
            flex="0 0 auto"
            padding="0 8px"
            center
            aria-pressed={highlightActive}
            style={
              highlightActive ? { backgroundColor: color, color: highlightTextColor } : undefined
            }
            onClick={toggleHighlight}
            title={highlightActive ? 'Remove highlight' : 'Apply highlight'}
          >
            Highlight
          </Button>
          <Button
            className={`apply-error-color${errorActive ? ' active' : ''}`}
            flex="0 0 auto"
            padding="0 8px"
            center
            aria-pressed={errorActive}
            style={
              errorActive
                ? { backgroundColor: ERROR_TEXT_COLOR, color: COLORS.SECONDARY }
                : undefined
            }
            textColor={ERROR_TEXT_COLOR}
            hoverColor={ERROR_TEXT_COLOR}
            onClick={toggleErrorColor}
            title={errorActive ? 'Remove error text color' : 'Apply error text color'}
          >
            Error
          </Button>
          <button
            type="button"
            className="color-square"
            aria-label="Choose highlight color"
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
          />
        </div>
        <Popout hidden={!open} pointerRight="8px" style={{ right: 0 }}>
          <div className="color-picker-container">
            <ColorPicker
              color={color}
              disableAlpha={true}
              presets={['#4b4310', '#A7F3D0', '#93C5FD', '#F9A8D4', '#FDBA74']}
              onChangePreview={handleColorChange}
            />
          </div>
        </Popout>
      </div>
      <style jsx>
        {`
          .controls {
            padding: 0 8px;
            display: flex;
            align-items: stretch;
          }
          .highlighter :global(button) {
            min-width: 24px;
          }
          .highlighter :global(.apply-highlight),
          .highlighter :global(.apply-error-color) {
            white-space: nowrap;
            border-radius: 3px;
            transition: background-color 150ms ease, color 150ms ease;
          }
          .highlighter :global(.apply-error-color) {
            margin-left: 4px;
          }
          /* an applied style keeps its button filled in, hover included. The thin ring
             keeps a dark fill from melting into the near-black toolbar. */
          .highlighter :global(.apply-highlight.active),
          .highlighter :global(.apply-highlight.active:hover),
          .highlighter :global(.apply-highlight.active:focus) {
            background-color: ${color} !important;
            color: ${highlightTextColor} !important;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28) !important;
          }
          .highlighter :global(.apply-error-color.active),
          .highlighter :global(.apply-error-color.active:hover),
          .highlighter :global(.apply-error-color.active:focus) {
            background-color: ${ERROR_TEXT_COLOR} !important;
            color: ${COLORS.SECONDARY} !important;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28) !important;
          }
          .color-square {
            cursor: pointer;
            appearance: none;
            outline: none;
            border: none;
            border-radius: 3px;
            padding: 12px;
            margin: 4px 0 4px 4px;
            background: ${color};
            box-shadow: ${`inset 0px 0px 0px ${open ? 2 : 1}px ${COLORS.SECONDARY}`};
          }
          .color-picker-container {
            width: 218px;
            border-top: 2px solid ${COLORS.SECONDARY};
          }
        `}
      </style>
    </div>
  )
}

export default SelectionEditor
