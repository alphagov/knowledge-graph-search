describe('Search results pagination', () => {
  it('Shows the pagination buttons on the results page when there are results', () => {
    cy.visit('?selected-words=ministry&search-in-text=false')
    cy.get('#button-prev-page')
    cy.get('#button-next-page')
  })

  it("Doesn't show the pagination buttons when no results", () => {
    cy.visit('?selected-words=sdljfn29847skdnfksjnfksj&search-in-text=false')
    cy.get('#button-prev-page').should('not.exist')
    cy.get('#button-next-page').should('not.exist')
  })

  it("Doesn't show the pagination buttons when less than 10 results ", () => {
    cy.visit('?selected-words=Disraeli&search-in-text=false')
    cy.get('#button-prev-page').should('not.exist')
    cy.get('#button-next-page').should('not.exist')
  })

  it('Shows the prev button disabled on the first page', () => {
    cy.visit('?selected-words=ministry&search-in-text=false')
    cy.get('#button-prev-page').should('be.disabled')
  })

  it('Shows the next button not disabled on the first page', () => {
    cy.visit('?selected-words=ministry&search-in-text=false')
    cy.get('#button-next-page').should('not.be.disabled')
  })

  it('Shows the next button disabled on the last page', () => {
    cy.visit('?selected-words=battle&search-in-text=false')
    cy.get('#results-heading').then((heading) => {
      const numResults = parseInt(heading.text().match(/^(\d+) results$/)[1])
      for (let skip = 0; skip + 10 < numResults; skip += 10) {
        console.log(skip, skip + 10, numResults)
        cy.get('#button-next-page').should('not.be.disabled').click()
      }
      cy.get('#button-next-page').should('be.disabled')
    })
  })
})
