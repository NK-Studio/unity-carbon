import React from 'react'
import AuthContext from './AuthContext'
import Meta from './Meta'
import Header from './Header'
import Announcement from './Announcement'
import LoginButton from './LoginButton'

const COLUMN = `
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
`
// injected from package.json at build time (see next.config.js)
const APP_VERSION = process.env.APP_VERSION
class Page extends React.Component {
  render() {
    const { children, enableHeroText, flex } = this.props
    return (
      <main className="main">
        <Meta />
        <AuthContext>
          <Announcement />
          <Header enableHeroText={enableHeroText} />
          <div className="login-button-container">
            <LoginButton />
          </div>
          <div className="page">{children}</div>
        </AuthContext>
        {APP_VERSION && <footer className="version">v{APP_VERSION}</footer>}

        <style jsx>
          {`
            .main {
              ${flex ? COLUMN : ''}
              /* anchors the version footer to the bottom of the page rather than to
                 the centered column, which would otherwise push the content upward */
              position: relative;
              /* fill the window so a short page sits in the middle of it; once the
                 content outgrows the window this only sets a floor and the page
                 scrolls normally. Padding, not margin, so the gap always stays
                 inside the scroll area. */
              min-height: 100vh;
              box-sizing: border-box;
              padding-top: 6rem;
              padding-bottom: 6rem;
            }
            .login-button-container {
              position: absolute;
              top: 1.4rem;
              right: 1rem;
            }
            .page {
              max-width: 100%;
              padding: 0 1rem;
            }
            /* sits inside the 6rem bottom padding, so it never crowds the content */
            .version {
              position: absolute;
              bottom: 2rem;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 12px;
              color: rgba(255, 255, 255, 0.32);
              user-select: none;
              pointer-events: none;
            }
            @media (min-width: 1024px) {
              .main {
                ${COLUMN};
              }
              .page {
                padding: 0;
              }
            }
          `}
        </style>
      </main>
    )
  }
}

export default Page
