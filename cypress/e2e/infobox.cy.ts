describe('Infobox results', () => {
  it('Shows the Person infobox', () => {
    cy.visit('?selected-words=%22Rishi+Sunak%22&search-in-text=false');
    cy.contains('div.meta-results-panel h2', 'Rishi Sunak');
    cy.contains('details summary span', 'Roles');
  });

  it('Shows the Role infobox', () => {
    cy.visit(
      '?selected-words=%22Chancellor+of+the+Exchequer%22&search-in-text=false'
    );
    cy.contains('div.meta-results-panel h2', 'Chancellor of the Exchequer');
    cy.contains('div.meta-results-panel p', 'Official role');
  });

  it('Shows the Taxon infobox', () => {
    cy.visit(
      '?selected-words=%22Access+to+the+countryside%22&search-in-text=false'
    );
    cy.contains('div.meta-results-panel h2', 'Access to the countryside');
    cy.contains('div.meta-results-panel p', 'GOV.UK Taxon');
  });

  it('Shows the BankHoliday infobox', () => {
    cy.visit('?selected-words=%22Boxing+Day%22&search-in-text=false');
    cy.contains('div.meta-results-panel h2', 'Boxing Day');
    cy.contains('div.meta-results-panel p', 'Bank holiday');
  });

  /*
  it('Shows the Organisation infobox', () => {
    cy.visit('?selected-words=%22Ministry+of+Defence%22&search-in-text=false')
    cy.contains('div.meta-results-panel h2', 'Ministry of Defence');
    cy.contains('div.meta-results-panel p', 'Government organisation');
  });
*/

  it('Shows the Transaction infobox', () => {
    cy.visit(
      '?selected-words=%22Accept+a+refugee+integration+loan%22&search-in-text=false'
    );
    cy.contains(
      'div.meta-results-panel h2',
      'Accept a refugee integration loan'
    );
    cy.contains('div.meta-results-panel p', 'Online government service');
  });
});
