import React from 'react'

// a half-filled disc - the usual shorthand for a light/dark theme switch
export default function Theme() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.9" stroke="white" strokeWidth="1.4" />
      <path d="M8 1.8A6.2 6.2 0 0 0 8 14.2Z" fill="white" />
    </svg>
  )
}
