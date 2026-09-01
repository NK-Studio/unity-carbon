import React from 'react'
import EmbedPage from './index'

import api from '../../lib/api'

class EmbedIdPage extends React.PureComponent {
  static async getInitialProps({ req, query }) {
    const { id: path, filename } = query
    const parameter = path && path.length >= 19 && path.indexOf('.') < 0 ? path : null

    let snippet
    if (parameter) {
      const host = req ? req.headers.host : undefined
      snippet = await api.snippet.get(parameter, { host, filename })
      if (snippet) {
        return { snippet }
      }
    }

    return {}
  }

  render() {
    return <EmbedPage {...this.props} />
  }
}

export default EmbedIdPage
