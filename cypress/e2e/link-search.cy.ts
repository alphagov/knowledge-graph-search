describe('Link search', () => {
  let numUnfilteredResults: number;
  it('returns nothing when just clicking Search', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('ul#show-fields').should('not.exist');
    cy.get('table#results-table').should('not.exist');
  });

  it('returns no results for an empty link search', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('input#link-search').type('wwekufsskjfdksufweuf');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains('No results');
  });

  it('returns results for an internal link search', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('input#link-search').type('/maternity-pay-leave');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
  });

  it('returns results for an external link search', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('input#link-search').type('youtube.com');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then((heading) => {
      numUnfilteredResults = parseInt(
        heading.text().match(/^(\d+) results$/)[1]
      );
    });
  });

  it('returns fewer results for an external link search in whitehall', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('.govuk-details__summary').click();
    cy.get('#area-whitehall').check();
    cy.get('input#link-search').type('youtube.com');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then((heading) => {
      const numWhitehallResults = parseInt(
        heading.text().match(/^(\d+) results$/)[1]
      );
      expect(numWhitehallResults).to.be.lessThan(numUnfilteredResults);
    });
  });

  it('returns fewer results for an external link search in publisher', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search').click();
    cy.get('.govuk-details__summary').click();
    cy.get('#area-publisher').check();
    cy.get('input#link-search').type('youtube.com');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then((heading) => {
      const numPublisherResults = parseInt(
        heading.text().match(/^(\d+) results$/)[1]
      );
      expect(numPublisherResults).to.be.lessThan(numUnfilteredResults);
    });
  });
});
