import React from 'react'

function Toast(props) {
  const [display, on] = React.useState(true)

  function off() {
    return on(false)
  }

  React.useEffect(() => {
    if (props.timeout) {
      const to = setTimeout(off, props.timeout)
      return () => clearTimeout(to)
    }
  }, [props.timeout])

  return (
    <div className={`toast mb2 ${display ? '' : 'out'}`}>
      <div className="toast-content">
        {props.children}
        {props.closable && (
          <button className="close" onClick={off}>
            &times;
          </button>
        )}
      </div>
      <style jsx>
        {`
          /* the toast holds its place at the bottom centre and only fades */
          @keyframes in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes out {
            from {
              opacity: 1;
            }
            97% {
              opacity: 0;
            }
            to {
              opacity: 0;
              display: none;
              height: 0;
              padding: 0;
              margin: 0;
            }
          }

          .toast {
            padding: 10px 18px;
            color: #fff;
            border: 1px solid #fff;
            border-radius: 4px;
            background: #000;
            font-size: 14px;
            text-align: center;
            animation-name: in;
            animation-duration: 240ms;
            animation-direction: forwards;
            animation-fill-mode: both;
            animation-timing-function: ease-out;
          }

          .toast.out {
            animation-name: out;
          }

          .toast-content {
            display: flex;
            align-items: center;
          }

          .toast :global(.close) {
            padding-left: 0;
            padding-right: 0;
            background: transparent;
            color: white;
            border: none;
            font-size: 100%;
            margin-left: 1rem;
            text-decoration: none;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  )
}

function ToastContainer(props) {
  return (
    <div className="toast">
      {props.toasts
        ? props.toasts
            .slice()
            .reverse()
            // an id lets the same message be shown again: a fresh key remounts the
            // toast instead of reusing one that already timed itself out
            .map(({ id, ...toast }) => <Toast key={id || toast.children} {...toast} />)
        : null}
      <style jsx>
        {`
          .toast {
            position: fixed;
            z-index: 9999;
            bottom: 1.5rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
          }

          .toast :global(.toast) {
            pointer-events: auto;
          }
        `}
      </style>
    </div>
  )
}

export default ToastContainer
