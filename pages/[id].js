import React from 'react'
import IndexPage from './index'

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: false,
  }
}

export async function getStaticProps() {
  return { props: {} }
}

export default React.memo(function IdPage(props) {
  return <IndexPage {...props} />
})
