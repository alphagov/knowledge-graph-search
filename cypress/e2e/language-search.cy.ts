let numUnfilteredResults;

describe('Language search', () => {
  it('returns no results for an empty language search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('button#search').click();
    cy.get('ul#show-fields').should('not.exist');
    cy.get('table#results-table').should('not.exist');
  });

  it('returns no results for a non-existing language search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('input#locale').type('wwekufsskjfdksufweuf');
    cy.get('button#search').click();
    cy.get('#results-heading', { timeout: 60000 }).contains('No results');
    cy.get('ul#show-fields').should('not.exist');
    cy.get('table#results-table').should('not.exist');
  });

  it('returns results for an existing language search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('input#locale').type('Welsh');
    cy.get('button#search').click();
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then(heading => {
      numUnfilteredResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
    });
    cy.get('#results-table');
    cy.location().should(loc => {
      expect(loc.search).to.eq('?search-type=language&lang=cy');
    });
  });

  it('returns fewer results for a Publisher language search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('input#locale').type('Welsh');
    cy.get('.govuk-details__summary').click();
    cy.get('#area-publisher').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then(heading => {
      const numPublisherResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
      expect(numPublisherResults).to.be.lessThan(numUnfilteredResults);
    });
    cy.get('#results-table');
    cy.location().should(loc => {
      expect(loc.search).to.eq('?search-type=language&lang=cy&area=publisher');
    });
  });

  it('returns fewer results for a Whitehall language search', () => {
    cy.visit('');
    cy.contains('button', 'Languages').click();
    cy.get('input#locale').type('Welsh');
    cy.get('.govuk-details__summary').click();
    cy.get('#area-whitehall').check();
    cy.get('button#search').click();
    cy.contains('button', 'Searching');
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
    cy.get('#results-heading').then(heading => {
      const numWhitehallResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
      expect(numWhitehallResults).to.be.lessThan(numUnfilteredResults);
    });
    cy.get('#results-table');
    cy.location().should(loc => {
      expect(loc.search).to.eq('?search-type=language&lang=cy&area=whitehall');
    });
  });



});
