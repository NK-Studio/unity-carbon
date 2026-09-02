import React from 'react'
import Head from 'next/head'

const BASE_PATH = process.env.BASE_PATH || ''
// bump when fonts.css changes so browsers do not keep serving the cached copy
const FONT_CSS_VERSION = '2'

export default function Font() {
  return (
    <Head>
      <link rel="stylesheet" href={`${BASE_PATH}/static/fonts/fonts.css?v=${FONT_CSS_VERSION}`} />
    </Head>
  )
}
