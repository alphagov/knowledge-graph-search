describe('Initialisation', () => {
  it('Connects to the server', () => {
    cy.visit('');
    cy.contains('GovGraph Search');
  });

  it('Connects to GovGraph', () => {
    cy.visit('');
    cy.contains('#error-summary-title').should('not.exist');

    // check that at least 100 taxons were loaded
    cy.contains('button', 'Taxons').click();
    cy.get('datalist#taxonList').then(datalist => {
      expect(datalist.children('option').length).to.be.greaterThan(100);
    });

    // check that at least 20 languages were loaded
    cy.contains('button', 'Languages').click();
    cy.get('datalist#localeList').then(datalist => {
      expect(datalist.children('option').length).to.be.greaterThan(20);
    });
  });
});
