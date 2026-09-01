// Theirs
import React from 'react'
import Router from 'next/router'

import Editor from './Editor'
import Toasts from './Toasts'
import { useAuth } from './AuthContext'

import { updateRouteState } from '../lib/routing'
import { clearSettings, saveSettings } from '../lib/util'

function onReset() {
  clearSettings()
  updateRouteState(Router, {})

  if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
      })
    })
  }
}

function toastsReducer(curr, action) {
  switch (action.type) {
    case 'ADD': {
      return curr.concat(action.toast)
    }
    case 'SET': {
      return action.toasts
    }
  }
  throw new Error('Unsupported action')
}

function EditorContainer(props) {
  const user = useAuth()

  // XXX use context
  const [snippet, setSnippet] = React.useState(props.snippet || null)
  // TODO update this reducer to only take one action
  const [toasts, setToasts] = React.useReducer(toastsReducer, [])

  const snippetId = snippet && snippet.id
  React.useEffect(() => {
    if (!snippetId) {
      return
    }
    const snippetPath = '/' + (snippetId || '')
    if (snippetPath === props.router.asPath) {
      return
    }

    // Reloads only if the snipped.id is different from before. Otherwise returns from above.
    props.router.push(
      {
        pathname: '/[id]',
        query: { id: snippetId },
      },
      snippetPath,
      {
        shallow: true,
        scroll: false,
      }
    )
  }, [snippetId, props.router])

  function onEditorUpdate(state) {
    if (user) {
      return
    }
    updateRouteState(props.router, state)
    saveSettings(state)
  }

  return (
    <>
      <Toasts toasts={toasts} />
      <Editor
        {...props}
        snippet={snippet}
        setSnippet={setSnippet}
        setToasts={setToasts}
        onUpdate={onEditorUpdate}
        onReset={onReset}
      />
    </>
  )
}

export default EditorContainer
