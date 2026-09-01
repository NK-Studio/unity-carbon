/* global cy */
import { editorVisible } from '../support'

describe('Bundled editor fonts', () => {
  it('uses JetBrains Mono Hangul everywhere and ignores legacy font settings', () => {
    cy.visit('/?fm=Hack&code=Unity%2520%25ED%2595%259C%25EA%25B8%2580', {
      onBeforeLoad(window) {
        window.localStorage.setItem(
          'CARBON_STATE',
          JSON.stringify({ fontFamily: 'Fira Code', fontUrl: 'data:font/woff;base64,unused' })
        )
      },
    })
    editorVisible()

    cy.get('body')
      .should('have.css', 'font-family')
      .and('contain', 'JetBrains Mono Hangul')
      .and('not.contain', 'D2Coding')
      .and('not.contain', 'Jetendard')
    cy.get('.CodeMirror')
      .should('have.css', 'font-family')
      .and('contain', 'JetBrains Mono Hangul')
      .and('not.contain', 'D2Coding')
      .and('not.contain', 'Jetendard')
    cy.document()
      .then(document => document.fonts.load('14px "JetBrains Mono Hangul"', 'Unity 한글'))
      .then(fonts => expect(fonts).to.have.length.greaterThan(0))
    cy.document().then(document => {
      const fontCss = Array.from(document.querySelectorAll('style'))
        .map(style => style.textContent)
        .join('\n')
      expect(fontCss).to.contain('/static/fonts/JetBrainsMonoHangul-Regular.ttf')
      expect(fontCss).not.to.contain('D2Coding-Regular')
      expect(fontCss).not.to.contain('Jetendard-Regular')
    })

    cy.get('.settings-container > button').click()
    cy.contains('.settings-menu', 'Editor').click()
    cy.get('.settings-content').should('not.contain', 'Font')
  })

  it('serves the bundled webfonts locally', () => {
    cy.request('/static/fonts/JetBrainsMonoHangul-Regular.ttf')
      .its('headers.content-type')
      .should('match', /font|octet-stream/)
  })

  it('draws Hangul on the same two-cell grid as the Latin glyphs', () => {
    cy.visit('/?code=Unity%2520%25ED%2595%259C%25EA%25B8%2580')
    editorVisible()

    cy.document()
      .then(document =>
        // both faces have to be resolved before either can be measured
        Promise.all([
          document.fonts.load('14px "JetBrains Mono Hangul"', 'M'),
          document.fonts.load('14px "JetBrains Mono Hangul"', '가'),
        ]).then(() => document)
      )
      .then(document => {
        const probe = document.createElement('span')
        probe.style.cssText =
          'position:absolute;visibility:hidden;white-space:pre;font:14px "JetBrains Mono Hangul", monospace'
        document.body.appendChild(probe)
        const width = text => {
          probe.textContent = text
          return probe.getBoundingClientRect().width / text.length
        }
        const latin = width('MMMMM')
        const hangul = width('가나다라마')
        probe.remove()

        // JetBrains Mono Hangul keeps JetBrains Mono's 0.6em Latin cell.
        expect(latin).to.be.closeTo(8.4, 0.5)
        // and a Hangul syllable stays exactly two of those cells wide
        expect(hangul).to.be.closeTo(latin * 2, 0.5)
      })
  })
})
