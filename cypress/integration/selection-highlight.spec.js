/* global cy */

describe('Selection highlight', () => {
  it('applies and partially removes a background color from selected text', () => {
    cy.visit('/?code=const%2520value%2520%253D%252042')

    cy.get('.CodeMirror', { timeout: 15000 }).then(([element]) => {
      element.CodeMirror.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 })
    })
    cy.get('#export-container').trigger('mouseup')

    cy.contains('#style-editor-button button', 'Highlight').should('be.visible')
    cy.contains('#style-editor-button button', 'Highlight').click()
    cy.get('.CodeMirror-code span')
      .filter((_, element) => getComputedStyle(element).backgroundColor === 'rgb(75, 67, 16)')
      .should('exist')

    cy.get('button[aria-label="Choose highlight color"]').click()
    cy.get('[title="#A7F3D0"]').click()

    cy.get('.CodeMirror').then(([element]) => {
      expect(element.CodeMirror.getAllMarks()).to.have.length(1)
      element.CodeMirror.setCursor({ line: 0, ch: 5 })
    })
    cy.get('.CodeMirror-code span')
      .filter((_, element) => getComputedStyle(element).backgroundColor === 'rgb(167, 243, 208)')
      .should('exist')
    cy.get('#style-editor-button').within(() => {
      cy.contains('button', 'B').should('not.exist')
      cy.contains('button', 'I').should('not.exist')
      cy.contains('button', 'U').should('not.exist')
    })

    cy.get('.CodeMirror').then(([element]) => {
      element.CodeMirror.setSelection({ line: 0, ch: 1 }, { line: 0, ch: 4 })
    })
    cy.get('#export-container').trigger('mouseup')
    cy.contains('#style-editor-button button', 'Remove').click()

    cy.get('.CodeMirror').then(([element]) => {
      const ranges = element.CodeMirror.getAllMarks().map(marker => {
        const { from, to } = marker.find()
        return {
          from: { line: from.line, ch: from.ch },
          to: { line: to.line, ch: to.ch },
        }
      })
      expect(ranges).to.deep.equal([
        { from: { line: 0, ch: 0 }, to: { line: 0, ch: 1 } },
        { from: { line: 0, ch: 4 }, to: { line: 0, ch: 5 } },
      ])
    })
  })

  it('applies and removes the error text color from selected text', () => {
    cy.visit('/?code=const%2520value%2520%253D%252042')

    cy.get('.CodeMirror', { timeout: 15000 }).then(([element]) => {
      element.CodeMirror.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 })
    })
    cy.get('#export-container').trigger('mouseup')
    cy.contains('#style-editor-button button', 'Error').click()

    cy.get('.CodeMirror').then(([element]) => {
      expect(element.CodeMirror.getAllMarks()).to.have.length(1)
      element.CodeMirror.setCursor({ line: 0, ch: 5 })
    })
    cy.get('.CodeMirror-code span')
      .filter((_, element) => getComputedStyle(element).color === 'rgb(237, 90, 68)')
      .should('exist')

    cy.get('.CodeMirror').then(([element]) => {
      element.CodeMirror.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 })
    })
    cy.get('#export-container').trigger('mouseup')
    cy.contains('#style-editor-button button', 'Remove').click()

    cy.get('.CodeMirror').then(([element]) => {
      expect(element.CodeMirror.getAllMarks()).to.have.length(0)
    })
  })
})
