import React from 'react'

const Header = ({ enableHeroText }) => (
  <header role="banner" className="mb4">
    <div className="header-content">
      {enableHeroText ? (
        <h2 className="mt0">
          소스 코드를 아름다운 이미지로 만들고 공유해 보세요.
          <br />
          아래 편집기에 코드를 입력하거나 파일을 끌어다 놓으면 시작됩니다.
        </h2>
      ) : null}
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

export default Header
