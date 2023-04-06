describe('Browser buttons behaviour', () => {
  it('goes back when user clicks back after results', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('input#keyword').type('"Air passenger duty"');
    cy.get('button#search').click();
    cy.get('span[data-target=keyword-results]', { timeout: 60000 }).contains(/\d+ pages/);
    cy.go('back')
    cy.get('ul#show-fields').should('not.exist');
    cy.get('table#results-table').should('not.exist');
  });

  it('shows the start page if the user presses reload on the start page', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('#results-heading').should('not.exist');
    cy.location().should(loc => expect(loc.search).to.eq(''));
    cy.reload();
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('#results-heading').should('not.exist');
    cy.location().should(loc => expect(loc.search).to.eq(''));
  });

  it('shows the same page if the user presses reload', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');
    cy.get('#results-heading').should('not.exist');
    cy.get('input#keyword').type('Air passenger duty');
    cy.get('button#search').click();
    cy.get('span[data-target=keyword-results]', { timeout: 60000 }).contains(/\d+ pages/);
    cy.reload();
    cy.location().should(loc => expect(loc.search).to.eq('?selected-words=Air+passenger+duty'));
    cy.get('span[data-target=keyword-results]', { timeout: 60000 }).contains(/\d+ pages/);
    cy.get('#results-table');
  });
});
