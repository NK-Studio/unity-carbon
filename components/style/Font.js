import React from 'react'
import Head from 'next/head'

const BASE_PATH = process.env.BASE_PATH || ''

export default function Font() {
  return (
    <Head>
      <link rel="stylesheet" href={`${BASE_PATH}/static/fonts/fonts.css`} />
    </Head>
  )
}
