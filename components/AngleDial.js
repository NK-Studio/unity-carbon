import React from 'react'

import Input from './Input'
import { COLORS } from '../lib/constants'

const SIZE = 34
const CENTER = SIZE / 2
const RADIUS = CENTER - 3

export function normalizeAngle(deg) {
  return ((Math.round(deg) % 360) + 360) % 360
}

// the shadow falls opposite the light, so x is negated to get the light's angle back
export function angleFromOffsets(offsetX, offsetY) {
  if (offsetX === 0 && offsetY === 0) {
    return 90
  }
  return normalizeAngle((Math.atan2(offsetY, -offsetX) * 180) / Math.PI)
}

function angleFromPoint(rect, clientX, clientY) {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  // screen y grows downward, so flip it to get a math-oriented angle
  return normalizeAngle((Math.atan2(centerY - clientY, clientX - centerX) * 180) / Math.PI)
}

function AngleDial({ label, angle, onChange }) {
  const dialRef = React.useRef(null)

  const updateFromEvent = React.useCallback(
    event => {
      onChange(
        angleFromPoint(dialRef.current.getBoundingClientRect(), event.clientX, event.clientY)
      )
    },
    [onChange]
  )

  const handlePointerDown = event => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromEvent(event)
  }

  const handlePointerMove = event => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromEvent(event)
    }
  }

  const handleKeyDown = event => {
    const step = event.shiftKey ? 15 : 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      onChange(normalizeAngle(angle + step))
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      onChange(normalizeAngle(angle - step))
    } else {
      return
    }
    event.preventDefault()
  }

  const handleInputChange = event => {
    const value = parseFloat(event.target.value)
    onChange(Number.isNaN(value) ? 0 : normalizeAngle(value))
  }

  const radians = (angle * Math.PI) / 180
  const pointerX = CENTER + Math.cos(radians) * RADIUS
  const pointerY = CENTER - Math.sin(radians) * RADIUS

  return (
    <div className="angle settings-row">
      <label htmlFor="angle-input">{label}</label>
      <div
        ref={dialRef}
        className="dial"
        role="slider"
        tabIndex={0}
        aria-label="Drop shadow angle"
        aria-valuenow={angle}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuetext={`${angle} degrees`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill="none" stroke={COLORS.SECONDARY} />
          <line
            x1={CENTER}
            y1={CENTER}
            x2={pointerX}
            y2={pointerY}
            stroke={COLORS.SECONDARY}
            strokeLinecap="round"
          />
          <circle cx={pointerX} cy={pointerY} r="2.5" fill={COLORS.SECONDARY} />
        </svg>
      </div>
      <div className="value">
        <Input
          id="angle-input"
          type="number"
          value={angle}
          min={0}
          max={359}
          onChange={handleInputChange}
          width="34px"
        />
        <span className="degree">°</span>
      </div>
      <style jsx>
        {`
          .angle {
            display: flex;
            align-items: center;
            height: 44px;
            padding: 0 12px 0 8px;
            user-select: none;
          }

          label {
            flex: 1;
          }

          .dial {
            display: flex;
            margin-right: 8px;
            cursor: grab;
            touch-action: none;
          }

          .dial:active {
            cursor: grabbing;
          }

          .value {
            display: flex;
            align-items: center;
          }

          .degree {
            margin-left: 2px;
            opacity: 0.6;
          }
        `}
      </style>
    </div>
  )
}

export default React.memo(AngleDial)
