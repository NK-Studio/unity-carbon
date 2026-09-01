import React from 'react'
import IndexPage from './index'

import api from '../lib/api'

class IdPage extends React.PureComponent {
  static async getInitialProps({ req, query }) {
    const { id: path, filename } = query
    const parameter = path && path.length >= 19 && path.indexOf('.') < 0 ? path : null

    let snippet
    if (parameter) {
      const host = req ? req.headers.host : undefined
      snippet = await api.snippet.get(parameter, { host, filename })
      if (snippet) {
        return { snippet, host }
      }
    }

    return {}
  }

  render() {
    return <IndexPage {...this.props} />
  }
}

export default IdPage
