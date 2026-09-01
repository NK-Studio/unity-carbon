import React from 'react'

import { FONT_FAMILY } from '../../lib/constants'

export default function Font() {
  return (
    <style jsx global>
      {`
        @font-face {
          font-family: '${FONT_FAMILY}';
          font-display: swap;
          src: url('/static/fonts/JetBrainsMonoHangul-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      `}
    </style>
  )
}
