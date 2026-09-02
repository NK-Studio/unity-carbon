import React, { useEffect, useState } from 'react'

import { DEFAULT_GREETING, pickGreeting } from '../lib/greetings'

const Header = ({ enableHeroText }) => {
  const [greeting, setGreeting] = useState(DEFAULT_GREETING)

  // 시간대별 문구는 서버/클라이언트 값이 달라 하이드레이션 후에 적용한다
  useEffect(() => {
    setGreeting(pickGreeting())
  }, [])

  return (
    <header role="banner" className="mb4">
      <div className="header-content">
        {enableHeroText ? <h2 className="mt0">{greeting}</h2> : null}
      </div>
      <style jsx>
        {`
          .header-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          h2 {
            text-align: center;
          }

          @media (max-width: 768px) {
            header {
              margin-bottom: var(--x3);
            }
            h2 {
              font-size: 13px;
            }
          }
        `}
      </style>
    </header>
  )
}

export default Header
