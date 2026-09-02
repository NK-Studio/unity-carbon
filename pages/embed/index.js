// Theirs
import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'

// Ours
import ApiContext from '../../components/ApiContext'
import { CodeMirrorLink, MetaTags } from '../../components/Meta'
import Font from '../../components/style/Font'
import Carbon from '../../components/Carbon'
import GlobalHighlights from '../../components/Themes/GlobalHighlights'
import { DEFAULT_CODE, DEFAULT_SETTINGS, DEFAULT_THEME, THEMES_HASH } from '../../lib/constants'
import { getRouteState } from '../../lib/routing'

const Page = ({ theme = DEFAULT_THEME, children }) => (
  <React.Fragment>
    <Head>
      <title>Carbon Embeds</title>
    </Head>
    <MetaTags />
    <CodeMirrorLink />
    <Font />
    {children}
    <GlobalHighlights theme={theme} />
    <style jsx global>
      {`
        html,
        body {
          margin: 0;
          background: transparent;
          min-height: 0;
        }
      `}
    </style>
  </React.Fragment>
)

class Embed extends React.Component {
  static contextType = ApiContext

  state = {
    ...DEFAULT_SETTINGS,
    code: DEFAULT_CODE,
    mounted: false,
    readOnly: true,
  }

  snippet = {}

  async componentDidMount() {
    const { queryState } = getRouteState(this.props.router)

    this.setState(
      {
        ...this.props.snippet,
        ...queryState,
        theme: THEMES_HASH[queryState.theme] ? queryState.theme : DEFAULT_THEME.id,
        highlights: null,
        fontFamily: DEFAULT_SETTINGS.fontFamily,
        fontUrl: null,
        copyable: queryState.copy !== false,
        readOnly: queryState.readonly !== false,
        mounted: true,
      },
      this.postMessage
    )
  }

  ref = React.createRef()

  postMessage = () => {
    setTimeout(
      () =>
        window.top.postMessage(
          JSON.stringify({
            // Used by embed provider
            src: window.location.toString(),
            context: 'iframe.resize',
            height: this.ref.current.offsetHeight,
          }),
          '*'
        ),
      0
    )
  }

  updateCode = code => {
    this.setState({ code }, this.postMessage)

    window.top.postMessage(
      {
        id: this.state.id ? `carbon:${this.state.id}` : 'carbon',
        code,
      },
      '*'
    )
  }

  render() {
    const theme = THEMES_HASH[this.state.theme] || DEFAULT_THEME

    return (
      <Page theme={theme}>
        <div hidden={!this.state.mounted}>
          <Carbon
            key={this.state.mounted}
            ref={this.ref}
            theme={theme}
            config={{ ...this.state, theme: theme.id, highlights: null }}
            readOnly={this.state.readOnly}
            copyable={this.state.copyable}
            onChange={this.updateCode}
          >
            {this.state.code}
          </Carbon>
        </div>
        <style jsx global>
          {`
            .eliminateOnRender {
              display: none;
            }
          `}
        </style>
      </Page>
    )
  }
}

export default withRouter(Embed)
