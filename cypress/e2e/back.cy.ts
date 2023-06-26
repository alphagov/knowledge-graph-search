describe('Browser buttons behaviour', () => {
  it('goes back to the previous page when clicking through search types', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.contains('button', 'Taxons').click()
    cy.contains('button', 'Languages').click()
    cy.go('back')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=taxon')
    })
    cy.go('back')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('')
    })
  })

  it('goes back when user clicks back after results', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Air passenger duty')
    cy.get('button#search').click()
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/)
    cy.go('back')
    cy.get('ul#show-fields').should('not.exist')
    cy.get('table#results-table').should('not.exist')
  })

  it('refetches old results when back', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Air passenger duty')
    cy.get('button#search').click()
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/)
    cy.contains('button', 'Languages').click()
    cy.get('table#results-table').should('not.exist')
    cy.go('back')
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/)
    cy.get('#results-table')
  })

  it('ends on the start page if going back, forward, back, back', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.contains('button', 'Taxons').click()
    cy.contains('button', 'Languages').click()
    cy.go('back')
    cy.go('forward')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=language')
    })
    cy.go('back')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=taxon')
    })
    cy.go('back')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('')
    })
  })

  it('shows the start page if the user presses reload on the start page', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.get('#results-heading').should('not.exist')
    cy.location().should((loc) => expect(loc.search).to.eq(''))
    cy.reload()
    cy.contains('#error-summary-title').should('not.exist')
    cy.get('#results-heading').should('not.exist')
    cy.location().should((loc) => expect(loc.search).to.eq(''))
  })

  it('shows the same page if the user presses reload', () => {
    cy.visit('')
    cy.contains('#error-summary-title').should('not.exist')
    cy.get('#results-heading').should('not.exist')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Air passenger duty')
    cy.get('button#search').click()
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/)
    cy.reload()
    cy.location().should((loc) =>
      expect(loc.search).to.eq(
        '?search-type=taxon&selected-taxon=Air+passenger+duty'
      )
    )
    cy.get('#results-heading', { timeout: 60000 }).contains(/^\d+ results$/)
    cy.get('#results-table')
  })
})
