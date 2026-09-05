// Theirs
import React from 'react'

export default function GlobalHighlights({ theme }) {
  const highlights = theme.highlights
  // the cursor and the selection band have to follow the background, not the palette
  const cursorColor = theme.light ? '#202020' : '#f0f0f0'
  const selectionColor = theme.light ? 'rgba(15, 84, 214, 0.18)' : 'rgba(255, 255, 255, 0.12)'

  return (
    <style jsx global>
      {`
        :global(.CodeMirror__container .CodeMirror) {
          color: ${highlights.text} !important;
          background-color: ${highlights.background} !important;
        }

        :global(.cm-string),
        :global(.cm-string-2) {
          color: ${highlights.string} !important;
        }
        :global(.cm-comment) {
          color: ${highlights.comment} !important;
        }
        :global(.cm-variable) {
          color: ${highlights.variable} !important;
        }
        :global(.cm-variable-2) {
          color: ${highlights.variable2 || highlights.variable} !important;
        }
        :global(.cm-variable-3) {
          color: ${highlights.variable3 || highlights.variable} !important;
        }
        :global(.cm-number) {
          color: ${highlights.number} !important;
        }
        :global(.cm-keyword) {
          color: ${highlights.keyword} !important;
        }
        /* clike marks built-in types (float, void, int); Rider colors those like keywords */
        :global(.cm-type) {
          color: ${highlights.type || highlights.keyword} !important;
        }
        /* null, true, false */
        :global(.cm-atom) {
          color: ${highlights.atom || highlights.keyword} !important;
        }
        :global(.cm-property) {
          color: ${highlights.property} !important;
        }
        :global(.cm-def) {
          color: ${highlights.definition} !important;
        }
        :global(.cm-meta) {
          color: ${highlights.meta} !important;
        }
        :global(.cm-operator) {
          color: ${highlights.operator} !important;
        }
        :global(.cm-attribute) {
          color: ${highlights.attribute} !important;
        }
        :global(.cm-tag) {
          color: ${highlights.tag} !important;
        }
        :global(.cm-builtin) {
          color: ${highlights.builtin} !important;
        }
        :global(.cm-unity-type),
        :global(.cm-unity-declared-type),
        :global(.cm-unity-namespace) {
          color: ${highlights.unityType || '#C191FF'} !important;
        }
        :global(.cm-unity-interface) {
          color: ${highlights.unityInterface || '#B18CFA'} !important;
        }
        :global(.cm-unity-delegate) {
          color: ${highlights.unityDelegate || '#D7BBFC'} !important;
        }
        :global(.cm-unity-method) {
          color: ${highlights.unityMethod || '#59C093'} !important;
        }
        :global(.cm-unity-event) {
          color: ${highlights.unityEvent || '#DE90B7'} !important;
        }
        :global(.cm-unity-member) {
          color: ${highlights.unityMember || '#66C3CC'} !important;
        }
        /* Rider paints value types apart from classes */
        :global(.cm-unity-struct),
        :global(.cm-unity-enum) {
          color: ${highlights.unityValueType || '#D7BBFC'} !important;
        }
        :global(.cm-unity-enum-member) {
          color: ${highlights.unityEnumMember || '#6FB9C4'} !important;
        }
        /* glob metacharacters in .gitignore / .gitattributes patterns */
        :global(.cm-git-glob) {
          color: ${highlights.gitGlob || '#ED94C0'} !important;
        }

        :global(.CodeMirror__container .CodeMirror-cursor) {
          border-left: solid 2px ${cursorColor} !important;
        }

        :global(.CodeMirror__container .CodeMirror-selected),
        :global(.CodeMirror__container .CodeMirror-line::selection),
        :global(.CodeMirror__container .CodeMirror-line > span::selection) {
          background: ${selectionColor} !important;
        }
      `}
    </style>
  )
}
