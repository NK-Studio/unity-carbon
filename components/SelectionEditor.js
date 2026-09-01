import React from 'react'
import { useKeyboardListener } from 'actionsack'
import Popout from './Popout'
import Button from './Button'
import ColorPicker from './ColorPicker'
import { COLORS } from '../lib/constants'

const DEFAULT_HIGHLIGHT_COLOR = '#4b4310'
const ERROR_TEXT_COLOR = '#ED5A44'

function SelectionEditor({ onChange }) {
  const [open, setOpen] = React.useState(false)
  const [color, setColor] = React.useState(DEFAULT_HIGHLIGHT_COLOR)

  useKeyboardListener('Escape', () => setOpen(false))

  const applyHighlight = nextColor => onChange({ backgroundColor: nextColor })
  const applyErrorColor = () => onChange({ color: ERROR_TEXT_COLOR })
  const removeSelectionStyles = () => onChange({ removeHighlight: true })
  const handleColorChange = value => {
    setColor(value.hex)
    applyHighlight(value.hex)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="highlighter">
        <div className="controls">
          <Button
            className="apply-highlight"
            flex="0 0 auto"
            padding="0 8px"
            center
            onClick={() => applyHighlight(color)}
            title="Apply highlight"
          >
            Highlight
          </Button>
          <Button
            className="apply-error-color"
            flex="0 0 auto"
            padding="0 8px"
            center
            textColor={ERROR_TEXT_COLOR}
            hoverColor={ERROR_TEXT_COLOR}
            onClick={applyErrorColor}
            title="Apply error text color"
          >
            Error
          </Button>
          <Button
            className="remove-highlight"
            flex="0 0 auto"
            padding="0 8px"
            center
            onClick={removeSelectionStyles}
            title="Remove selection styles"
          >
            Remove
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
          .highlighter :global(.apply-error-color),
          .highlighter :global(.remove-highlight) {
            white-space: nowrap;
          }
          .highlighter :global(.apply-error-color),
          .highlighter :global(.remove-highlight) {
            margin-left: 4px;
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
