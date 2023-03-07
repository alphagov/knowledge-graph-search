// describe('Organisation search', () => {
//   let numUnfilteredResults: number;
//   it('returns no results for an empty organisation search', () => {
//     cy.visit('');
//     cy.contains('button', 'Organisations').click();
//     cy.get('button#search').click();
//     cy.get('ul#show-fields').should('not.exist');
//     cy.get('table#results-table').should('not.exist');
//   });

//   it('returns no results for a non-existing organisation search', () => {
//     cy.visit('');
//     cy.contains('button', 'Organisations').click();
//     cy.get('input#organisation').type('wwekufsskjfdksufweuf');
//     cy.get('button#search').click();
//     cy.get('#results-heading', { timeout: 60000 }).contains('No results');
//     cy.get('ul#show-fields').should('not.exist');
//     cy.get('table#results-table').should('not.exist');
//   });

//   it('returns results for an existing organisation search', () => {
//     cy.visit('');
//     cy.contains('button', 'Organisations').click();
//     cy.get('input#organisation').type('Environment Agency');
//     cy.get('button#search').click();
//     cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
//     cy.get('#results-heading').then(heading => {
//       numUnfilteredResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
//     });
//     cy.get('#results-table');
//   });

//   it('returns fewer results for a Publisher organisation search', () => {
//     cy.visit('');
//     cy.contains('button', 'Organisations').click();
//     cy.get('input#organisation').type('Environment Agency');
//     cy.get('.govuk-details__summary').click();
//     cy.get('#area-publisher').check();
//     cy.get('button#search').click();
//     cy.contains('button', 'Searching');
//     cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
//     cy.get('#results-heading').then(heading => {
//       const numPublisherResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
//       expect(numPublisherResults).to.be.lessThan(numUnfilteredResults);
//     });
//     cy.get('#results-table');
//   });

//   it('returns fewer results for a Whitehall organisation search', () => {
//     cy.visit('');
//     cy.contains('button', 'Organisations').click();
//     cy.get('input#organisation').type('Environment Agency');
//     cy.get('.govuk-details__summary').click();
//     cy.get('#area-whitehall').check();
//     cy.get('button#search').click();
//     cy.contains('button', 'Searching');
//     cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/);
//     cy.get('#results-heading').then(heading => {
//       const numWhitehallResults = parseInt(heading.text().match(/^(\d+) results$/)[1]);
//       expect(numWhitehallResults).to.be.lessThan(numUnfilteredResults);
//     });
//     cy.get('#results-table');
//   });



// });
