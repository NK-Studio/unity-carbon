import React from 'react'

import Input from './Input'
import { COLORS } from '../lib/constants'

class Slider extends React.Component {
  static defaultProps = {
    onMouseDown: () => {},
    onMouseUp: () => {},
    unit: 'px',
  }

  handleChange = e => {
    this.props.onChange(`${e.target.value}${this.props.unit}`)
  }

  handleInputChange = e => {
    const minValue = this.props.minValue || 0
    const maxValue = this.props.maxValue || 100
    const parsed = parseFloat(e.target.value)

    if (Number.isNaN(parsed)) {
      return
    }

    this.props.onChange(`${Math.min(Math.max(parsed, minValue), maxValue)}${this.props.unit}`)
  }

  render() {
    const minValue = this.props.minValue || 0
    const maxValue = this.props.maxValue || 100
    const step = 'step' in this.props ? this.props.step : 1

    const value = parseFloat(this.props.value)
    const currentValue = Number.isNaN(value) ? minValue : value

    return (
      <div className="slider settings-row">
        <div
          className="slider-bg"
          style={{
            transform: `translate3d(${
              (((currentValue - minValue) * 1.0) / (maxValue - minValue)) * 100
            }%, 0px, 0px)`,
          }}
        />
        <label>{this.props.label}</label>
        <input
          type="range"
          value={currentValue}
          onChange={this.handleChange}
          onMouseDown={this.props.onMouseDown}
          onMouseUp={this.props.onMouseUp}
          min={minValue}
          max={maxValue}
          step={step}
        />
        {this.props.editable && (
          <div className="slider-value">
            <Input
              type="number"
              aria-label={this.props.label}
              value={currentValue}
              min={minValue}
              max={maxValue}
              step={step}
              onChange={this.handleInputChange}
              width="38px"
            />
            <span className="slider-unit">{this.props.unit}</span>
          </div>
        )}
        <style jsx>
          {`
            .slider {
              position: relative;
              height: 33px;
              overflow: hidden;
              user-select: none;
            }

            .slider:last-of-type {
              border-bottom: 0;
            }

            label {
              position: absolute;
              left: 8px;
              height: 33px;
              line-height: 33px;
            }

            input {
              opacity: 0;
              cursor: ew-resize;
              position: relative;
              height: 100%;
              width: 100%;
              margin: 0;
            }

            .slider-value {
              position: absolute;
              top: 0;
              right: 8px;
              z-index: 2;
              display: flex;
              align-items: center;
              height: 33px;
            }

            .slider-unit {
              margin-left: 2px;
              opacity: 0.6;
            }

            .slider-bg {
              position: absolute;
              top: 0;
              bottom: 0;
              pointer-events: none;
              height: 33px;
              width: 100%;
              background: ${COLORS.DARK_GRAY};
            }
          `}
        </style>
      </div>
    )
  }
}

export default Slider
