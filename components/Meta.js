import React from 'react'
import Head from 'next/head'
import { COLORS } from '../lib/constants'
import Reset from './style/Reset'
import Font from './style/Font'
import Typography from './style/Typography'

const CODEMIRROR_VERSION = '5.65.5'

export function Link({ href }) {
  return (
    <Head>
      <link rel="preload" as="style" href={href} />
      <link rel="stylesheet" href={href} />
    </Head>
  )
}

export const CodeMirrorLink = () => (
  <Link
    href={`//cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/codemirror.min.css`}
  />
)

const title = 'NKStudio'
const description = '유니티 소스 코드를 아름다운 이미지로 만들고 공유하는 가장 쉬운 방법'
export const MetaTags = React.memo(() => (
  <Head>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="description" content={description} />
    <meta name="application-name" content={title} />
    <meta name="og:title" content={title} />
    <meta name="og:description" content={description} />
    <meta name="og:image" content="/static/brand/banner.png" />
    <meta name="theme-color" content={COLORS.BLACK} />
    <meta name="apple-mobile-web-app-status-bar-style" content={COLORS.BLACK} />
    <title>{title} | 소스 코드를 문서화하다.</title>
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/static/brand/apple-touch-icon.png" />
  </Head>
))

export const MetaLinks = React.memo(() => {
  return <CodeMirrorLink />
})

export default React.memo(function Meta() {
  return (
    <React.Fragment>
      <MetaTags />
      <Reset />
      <Font />
      <Typography />
    </React.Fragment>
  )
})
