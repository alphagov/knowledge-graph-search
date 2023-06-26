describe('Search results facets', () => {
  it('Shows the facet selector on the results page', () => {
    cy.visit('?selected-words=ministry&search-in-text=false');
    cy.contains('For each result, display:');
    cy.get('ul#show-fields li').then((fields) => {
      cy.expect(fields.length).to.be.greaterThan(10);
    });
  });

  it('Shows URL and title of results by default', () => {
    cy.visit('?selected-words=ministry&search-in-text=false');
    cy.get('tr th[scope="col"]').then((headings) => {
      cy.expect(headings.length).to.equal(3);
    });
    cy.contains('th', 'Page'); // hidden but it's there for a11y
    cy.contains('th', 'URL');
    cy.contains('th', 'Title');
  });

  it('Shows the contentId of results when clicking contentId', () => {
    cy.visit('?selected-words=ministry&search-in-text=false');
    cy.get('input#show-field-contentId').check();
    cy.get('tr th[scope="col"]').then((headings) => {
      cy.expect(headings.length).to.equal(4);
    });
    cy.contains('th', 'Page');
    cy.contains('th', 'URL');
    cy.contains('th', 'Title');
    cy.contains('th', 'contentId');
    cy.get('td:eq(2)').then(($th) => {
      cy.expect($th.text()).to.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  it('Shows the First published of results when clicking First published', () => {
    const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2} at [0-9]{2}:[0-9]{2}$/;
    cy.visit('?selected-words=ministry&search-in-text=false');
    cy.get('input#show-field-first_published_at').check();
    cy.get('tr th[scope="col"]').then((headings) => {
      cy.expect(headings.length).to.equal(4);
    });
    cy.contains('th', 'Page');
    cy.contains('th', 'URL');
    cy.contains('th', 'Title');
    cy.contains('th', 'First published');
    cy.get('td:eq(2)').then(($th) => cy.expect($th.text()).to.match(dateRegex));
  });

  it("Doesn't show any null value when clicking on any field", () => {
    const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2} at [0-9]{2}:[0-9]{2}$/;
    const dateRegexOrNotWithdrawn =
      /^([0-9]{4}-[0-9]{2}-[0-9]{2} at [0-9]{2}:[0-9]{2}|not withdrawn)$/;
    const contentIdRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    cy.visit('?selected-words=ministry&search-in-text=false');
    cy.get('td:eq(0)').then(($th) => {
      cy.expect($th.text()).to.match(/^https:\/\/www.gov.uk\//);
    });
    cy.get('td:eq(1)').then(($th) => cy.expect($th.text()).to.not.equal('null'));
    cy.get('input#show-field-documentType').check();
    cy.get('td:eq(2)').then(($th) => cy.expect($th.text()).to.not.equal('null'));
    cy.get('input#show-field-contentId').check();
    cy.get('td:eq(3)').then(($th) =>
      cy.expect($th.text()).to.match(contentIdRegex)
    );
    cy.get('input#show-field-locale').check();
    cy.get('td:eq(4)').then(($th) => cy.expect($th.text()).to.not.equal('null'));
    cy.get('input#show-field-publishing_app').check();
    cy.get('td:eq(5)').then(($th) => cy.expect($th.text()).to.not.equal('null'));
    cy.get('input#show-field-first_published_at').check();
    cy.get('td:eq(6)').then(($th) => cy.expect($th.text()).to.match(dateRegex));
    cy.get('input#show-field-public_updated_at').check();
    cy.get('td:eq(7)').then(($th) => cy.expect($th.text()).to.match(dateRegex));
    cy.get('input#show-field-withdrawn_at').check();
    cy.get('td:eq(8)').then(($th) =>
      cy.expect($th.text()).to.match(dateRegexOrNotWithdrawn)
    );
    cy.get('input#show-field-withdrawn_explanation').check();
    cy.get('td:eq(9)').then(($th) => cy.expect($th.text()).to.not.equal('null'));
    cy.get('input#show-field-page_views').check();
    cy.get('td:eq(10)').then(($th) => cy.expect($th.text()).to.match(/^\d+?$/));
    cy.get('input#show-field-taxons').check();
    cy.get('td:eq(11)').then(($th) =>
      cy.expect($th.text()).to.not.equal('null')
    );
    cy.get('input#show-field-primary_organisation').check();
    cy.get('td:eq(12)').then(($th) =>
      cy.expect($th.text()).to.not.equal('null')
    );
    cy.get('input#show-field-all_organisations').check();
    cy.get('td:eq(13)').then(($th) =>
      cy.expect($th.text()).to.not.equal('null')
    );
  });
});
