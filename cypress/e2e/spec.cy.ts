describe('Initialisation', () => {
  it('Connects to the server', () => {
    cy.visit('http://localhost:3000');
    cy.contains('GovGraph Search');
  });

  it('Connects to GovGraph', () => {
    cy.visit('http://localhost:3000');
    cy.contains('#error-summary-title').should('not.exist');
  });
});


describe('Interface', () => {
  it('Changes search title when clicking on search type button', () => {
    cy.visit('http://localhost:3000');
    cy.get('button#search-keyword.active');
    cy.contains('Search for keywords');
    cy.contains('button', 'Links').click();
    cy.contains('Search for links');
    cy.contains('Search for keywords').should('not.exist');
    cy.contains('button', 'Mixed').click();
    cy.contains('Mixed search');
  });

  it('Shows the correct filters in keywords search', () => {
    cy.visit('http://localhost:3000');
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
    cy.visit('http://localhost:3000');
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
    cy.visit('http://localhost:3000');
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
    cy.visit('http://localhost:3000');
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
    cy.visit('http://localhost:3000');
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



describe('Keyword searching', () => {
  it('returns nothing when just clicking Search', () => {
    cy.visit('http://localhost:3000');
    cy.get('button#search').click();
    cy.get('ul#show-fields').should('not.exist');
    cy.get('table#results-table').should('not.exist');
  });

  it('returns no results when no keywords match', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('wwekufsskjfdksufweuf');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains('No results');
    cy.title().should('eq', 'GOV.UK pages that contain "wwekufsskjfdksufweuf" - GovGraph search')
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=wwekufsskjfdksufweuf');
    });

  });

  it('returns results when searching for searching keywords that exist', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('Churchill');
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.contains('for pages that contain');
    cy.contains('Showing results 1 to 10, in descending popularity');
    cy.contains('For each result, display:');
    cy.get('#results-table');
    cy.title().should('eq', 'GOV.UK pages that contain "Churchill" - GovGraph search')
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=Churchill');
    });
  });

  it('returns results when searching in title only', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('Churchill');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.contains('in their title');
    cy.get('#results-table');
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=Churchill&search-in-text=false');
    });
  });

  it('returns results when searching in body only', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('Churchill');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-title').uncheck();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.contains('in their body content');
    cy.get('#results-table');
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=Churchill&search-in-title=false');
    });
  });

  it('shows an error when unchecking both body and title', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('Churchill');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-title').uncheck();
    cy.get('#search-text').uncheck();
    cy.get('button#search').click();
    cy.title().should('eq', 'GovGraph search')
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=Churchill&search-in-title=false&search-in-text=false');
    });
    cy.get('div.govuk-error-summary');
    cy.contains('There is a problem');
    cy.contains('You need to select a keyword location');
  });

  it('returns results when searching in Publisher only', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('education');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('#area-publisher').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.contains('in their title');
    cy.get('#results-table');
    cy.title().should('eq', 'GOV.UK pages that contain "education" in their title and are published using "publisher" - GovGraph search')
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=education&search-in-text=false&area=publisher');
    });
  });

  it('returns results when searching in Whitehall only', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('education');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('#area-whitehall').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.contains('in their title');
    cy.get('#results-table');
    cy.title().should('eq', 'GOV.UK pages that contain "education" in their title and are published using "whitehall" - GovGraph search')
    cy.location().should(loc => {
      expect(loc.search).to.eq('?selected-words=education&search-in-text=false&area=whitehall');
    });
  });

  it('returns no results when doing an empty case-sensitive search', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('edUcatIon');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('#case-sensitive').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains('No results');
    cy.title().should('eq', 'GOV.UK pages that contain "edUcatIon" in their title - GovGraph search')
  });

  it('returns results when doing an "any keywords" search', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('sunak disraeli');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('#combinator-any').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-table');
    cy.title().should('eq', 'GOV.UK pages that contain "sunak" or "disraeli" in their title - GovGraph search')
  });

  it('returns results when doing an empty "all keywords" search', () => {
    cy.visit('http://localhost:3000');
    cy.get('input#keyword').type('sunak disraeli');
    cy.get('.govuk-details__summary').click();
    cy.get('#search-text').uncheck();
    cy.get('#combinator-all').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains('No results');
    cy.title().should('eq', 'GOV.UK pages that contain "sunak" and "disraeli" in their title - GovGraph search')
  });


});

// TODO:
// - make sure that form is filled on results page
// - URL
// - pagination
// - back button
// - CSV download
// - results fields
// - title
// - Mock API when we have tests to check for cypher query
