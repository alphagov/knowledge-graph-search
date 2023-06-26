describe('CSV download link', () => {
  it('Shows a CSV download link with a blob href', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-text').uncheck()
    cy.get('input#keyword').type('ministry')
    cy.get('button#search').click()
    cy.get('a[download="export.csv"]')
      .contains('Download all')
      .invoke('attr', 'href')
      .should('eq', '/csv?selected-words=ministry&search-in-text=false')
  })
})
