describe('Interface', () => {
  it('Changes search title when clicking on search type button', () => {
    cy.visit('');
    cy.get('button#search-keyword.active');
    cy.contains('Search for keywords');
    cy.contains('button', 'Links').click();
    cy.contains('Search for links');
    cy.contains('Search for keywords').should('not.exist');
    cy.contains('button', 'Mixed').click();
    cy.contains('Mixed search');
  });

  it('Shows the correct filters in keywords search', () => {
    cy.visit('');
    cy.get('input#keyword');
    cy.get('input#link-search').should('not.exist');
    cy.get('button#search-keyword.active');
    cy.contains('details', 'Filters');
    cy.get('.govuk-details__summary').click();
    cy.contains('Search for');
    cy.contains('Exclude keywords')
    cy.contains('case-sensitive search');
    cy.contains('Keyword location');
    cy.contains('Search for links').should('not.exist');
    cy.contains('Search for taxons').should('not.exist');
    cy.contains('Search for languages').should('not.exist');
    cy.contains('Limit search');
    cy.contains('button', 'Search');
  });

  it('Shows the correct filters in links search', () => {
    cy.visit('');
    cy.contains('button', 'Links').click();
    cy.get('button#search-link.active');
    cy.get('input#link-search');
    cy.get('input#keyword').should('not.exist');
    cy.contains('details', 'Filters');
    cy.get('.govuk-details__summary').click();
    cy.contains('Exclude keywords').should('not.exist');
    cy.contains('case-sensitive search').should('not.exist');
    cy.contains('Keyword location').should('not.exist');
    cy.contains('Search for links');
    cy.contains('Search for taxons').should('not.exist');
    cy.contains('Search for languages').should('not.exist');
    cy.contains('Limit search');
    cy.contains('button', 'Search');
  });

  it('Shows the correct filters in taxons search', () => {
    cy.visit('');
    cy.contains('button', 'Taxons').click();
    cy.get('button#search-taxon.active');
    cy.get('input#taxon');
    cy.get('input#keyword').should('not.exist');
    cy.contains('details', 'Filters');
    cy.get('.govuk-details__summary').click();
    cy.contains('Exclude keywords').should('not.exist');
    cy.contains('case-sensitive search').should('not.exist');
    cy.contains('Keyword location').should('not.exist');
    cy.contains('Search for links').should('not.exist');
    cy.contains('Search for taxons');
    cy.contains('Search for languages').should('not.exist');
    cy.contains('Limit search');
    cy.contains('button', 'Search');
  });


  it('Shows the correct filters in languages search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('button#search-language.active');
    cy.get('input#locale');
    cy.get('input#keyword').should('not.exist');
    cy.contains('details', 'Filters');
    cy.get('.govuk-details__summary').click();
    cy.contains('Exclude keywords').should('not.exist');
    cy.contains('case-sensitive search').should('not.exist');
    cy.contains('Keyword location').should('not.exist');
    cy.contains('Search for links').should('not.exist');
    cy.contains('Search for taxons').should('not.exist');
    cy.contains('Search for languages');
    cy.contains('Limit search');
    cy.contains('button', 'Search');
  });

  it('Shows the correct filters in mixed search', () => {
    cy.visit('');
    cy.contains('button', 'Mixed').click();
    cy.get('button#search-mixed.active');
    cy.get('input#keyword');
    cy.contains('details', 'Filters').should('not.exist');
    cy.contains('Exclude keywords');
    cy.contains('case-sensitive search');
    cy.contains('Keyword location');
    cy.contains('Search for links');
    cy.contains('Search for taxons');
    cy.contains('Search for languages');
    cy.contains('Limit search');
    cy.contains('button', 'Search');
  });
});
