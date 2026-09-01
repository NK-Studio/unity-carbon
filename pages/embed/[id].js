import React from 'react'
import EmbedPage from './index'

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: false,
  }
}

export async function getStaticProps() {
  return { props: {} }
}

export default React.memo(function EmbedIdPage(props) {
  return <EmbedPage {...props} />
})
