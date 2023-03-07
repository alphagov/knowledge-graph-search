describe('Initialisation', () => {
  it('Connects to the server', () => {
    cy.visit('');
    cy.contains('Gov Search');
  });

  it('Connects to the backend', () => {
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

    // // check that at least 20 organisations were loaded
    // cy.contains('button', 'Organisations').click();
    // cy.get('datalist#orgList').then(datalist => {
    //   expect(datalist.children('option').length).to.be.greaterThan(20);
    // });

  });
});
