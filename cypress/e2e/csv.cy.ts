describe('CSV download link', () => {
  it('Shows a CSV download link in the keyword search tab', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('input#keyword').type('ministry');
    cy.get('button#search').click();
    cy.get('a.govuk-link').contains('Download all').invoke('attr', 'href').should('eq', '/csv/keywords/?selected-words=ministry');
  });
  it('Shows a CSV download link in the link search tab', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('input#keyword').type('youtube.com');
    cy.get('button#search').click();
    cy.get('span[data-target=link-results]').click();
    cy.get('a.govuk-link').contains('Download all').invoke('attr', 'href').should('eq', '/csv/links/?selected-words=youtube.com');
  });
});
