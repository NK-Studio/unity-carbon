/* global cy */
import { editorVisible } from '../support'

// usually we can visit the page before each test
// but these tests use the url, which means wasted page load
// so instead visit the desired url in each test

describe('localStorage', () => {
  it.skip('is empty initially', () => {
    cy.visit('/')
    editorVisible()
    cy.window().its('localStorage').should('have.length', 0)
  })

  it('ignores a legacy saved theme without deleting it', () => {
    const legacySettings = {
      theme: 'blackboard',
      highlights: { background: 'red' },
    }

    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.setItem('CARBON_STATE', JSON.stringify(legacySettings))
      },
    })
    editorVisible()

    cy.get('[data-cy="themes-container"]').should('not.exist')
    cy.get('.CodeMirror').should('have.css', 'background-color', 'rgb(25, 26, 28)')
    cy.window()
      .its('localStorage.CARBON_STATE')
      .then(JSON.parse)
      .should('deep.equal', legacySettings)
  })
})
