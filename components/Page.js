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

        <style jsx>
          {`
            .main {
              ${flex ? COLUMN : ''}
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
