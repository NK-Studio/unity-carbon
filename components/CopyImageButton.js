import React from 'react'
import { useAsyncCallback, useKeyboardListener } from 'actionsack'

import { COLORS } from '../lib/constants'
import Button from './Button'
import CopySVG from './svg/Copy'

function useClipboardSupport() {
  const [isClipboardSupported, setClipboardSupport] = React.useState(false)

  React.useEffect(() => {
    setClipboardSupport(
      window.navigator && window.navigator.clipboard && typeof ClipboardItem === 'function'
    )
  }, [])

  return isClipboardSupported
}

function CopyImageButton({ copyImage, onUnsupported }) {
  const clipboardSupported = useClipboardSupport()

  const [copy, { loading }] = useAsyncCallback(async (...args) => {
    if (!clipboardSupported) {
      onUnsupported()
      return
    }
    await copyImage(...args)
  })

  useKeyboardListener('⌘-⇧-c', e => {
    e.preventDefault()
    copy(e)
  })

  return (
    <div className="copy-image-button">
      <div className="flex">
        <Button
          center
          border
          large
          padding="0 16px"
          margin="0 8px 0 0"
          onClick={copy}
          disabled={loading}
          color={COLORS.SECONDARY}
          title="Copy image to clipboard"
        >
          <CopySVG size={16} color={COLORS.SECONDARY} />
        </Button>
      </div>
      <style jsx>
        {`
          .copy-image-button {
            position: relative;
            color: ${COLORS.SECONDARY};
            flex: 1;
            max-width: 40px;
          }
        `}
      </style>
    </div>
  )
}

export default React.memo(CopyImageButton)
