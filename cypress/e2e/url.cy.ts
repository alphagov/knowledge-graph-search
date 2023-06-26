describe('URL Setting', () => {
  it('Returns no QSP for an empty link search', () => {
    cy.visit('')
    cy.contains('button', 'Links').click()
    cy.get('button#search').click()
    cy.get('input#link-search').type('wwekufsskjfdksufweuf')
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=link&link-search-url=wwekufsskjfdksufweuf'
      )
    })
  })

  it('Sets the correct URL for a link search', () => {
    cy.visit('')
    cy.contains('button', 'Links').click()
    cy.get('input#link-search').type('/maternity-pay-leave')
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=link&link-search-url=%2Fmaternity-pay-leave'
      )
    })
  })

  it('Sets the correct URL for a link search in whitehall', () => {
    cy.visit('')
    cy.contains('button', 'Links').click()
    cy.get('button#search').click()
    cy.get('.govuk-details__summary').click()
    cy.get('#area-whitehall').check()
    cy.get('input#link-search').type('youtube.com')
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=link&link-search-url=youtube.com&area=whitehall'
      )
    })
  })

  it('Sets the correct URL when no keywords match', () => {
    cy.visit('')
    cy.get('input#keyword').type('wwekufsskjfdksufweuf')
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=wwekufsskjfdksufweuf')
    })
  })

  it('Sets the correct URL when searching for keywords that exist', () => {
    cy.visit('')
    cy.get('input#keyword').type('Churchill')
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=Churchill')
    })
  })

  it('Sets the correct URL when searching in title only', () => {
    cy.visit('')
    cy.get('input#keyword').type('Churchill')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-text').uncheck()
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=Churchill&search-in-text=false')
    })
  })

  it('Sets the correct URL when searching in body only', () => {
    cy.visit('')
    cy.get('input#keyword').type('Churchill')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-title').uncheck()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?selected-words=Churchill&search-in-title=false'
      )
    })
  })

  it('Sets the correct inputs when unchecking both body and title', () => {
    cy.visit('')
    cy.get('input#keyword').type('Churchill')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-title').uncheck()
    cy.get('#search-text').uncheck()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?selected-words=Churchill&search-in-title=false&search-in-text=false'
      )
    })
  })

  it("Sets the correct URL when searching for 'education' everywhere", () => {
    cy.visit('')
    cy.get('input#keyword').type('education')
    cy.get('.govuk-details__summary').click()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=education')
    })
  })

  it('returns fewer results when searching in Publisher only', () => {
    cy.visit('')
    cy.get('input#keyword').type('education')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-text').uncheck()
    cy.get('#area-publisher').check()
    cy.get('button#search').click()
    cy.contains('button', 'Searching')
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?selected-words=education&search-in-text=false&area=publisher'
      )
    })
  })

  it('returns fewer results when searching in Whitehall only', () => {
    cy.visit('')
    cy.get('input#keyword').type('education')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-text').uncheck()
    cy.get('#area-whitehall').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?selected-words=education&search-in-text=false&area=whitehall'
      )
    })
  })

  it('returns no results when doing an empty case-sensitive search', () => {
    cy.visit('')
    cy.get('input#keyword').type('edUcatIon')
    cy.get('.govuk-details__summary').click()
    cy.get('#search-text').uncheck()
    cy.get('#case-sensitive').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?selected-words=edUcatIon&case-sensitive=true&search-in-text=false'
      )
    })
  })

  it('Sets the correct URL when doing an "any keywords" search', () => {
    cy.visit('')
    cy.get('input#keyword').type('sunak disraeli')
    cy.get('.govuk-details__summary').click()
    cy.get('#combinator-any').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=sunak+disraeli&combinator=any')
    })
  })

  it('Sets the correct URL when doing an "all keywords" search', () => {
    cy.visit('')
    cy.get('input#keyword').type('sunak disraeli')
    cy.get('.govuk-details__summary').click()
    cy.get('#combinator-all').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?selected-words=sunak+disraeli')
    })
  })

  it('Sets the correct URL for an existing taxon search', () => {
    cy.visit('')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Environment')
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=taxon&selected-taxon=Environment')
    })
  })

  it('Sets the correct URL for a Publisher taxon search', () => {
    cy.visit('')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Environment')
    cy.get('.govuk-details__summary').click()
    cy.get('#area-publisher').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=taxon&selected-taxon=Environment&area=publisher'
      )
    })
  })

  it('Sets the correct URL for a Whitehall taxon search', () => {
    cy.visit('')
    cy.contains('button', 'Taxons').click()
    cy.get('input#taxon').type('Environment')
    cy.get('.govuk-details__summary').click()
    cy.get('#area-whitehall').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=taxon&selected-taxon=Environment&area=whitehall'
      )
    })
  })

  it('returns no results for an empty language search', () => {
    cy.visit('')
    cy.contains('button', 'Languages').click()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=language')
    })
  })

  it('returns no results for a non-existing language search', () => {
    cy.visit('')
    cy.contains('button', 'Languages').click()
    cy.get('input#locale').type('wwekufsskjfdksufweuf')
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq(
        '?search-type=language&lang=wwekufsskjfdksufweuf'
      )
    })
  })

  it('Sets the correct URL for an existing language search', () => {
    cy.visit('')
    cy.contains('button', 'Languages').click()
    cy.get('input#locale').type('Welsh')
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=language&lang=cy')
    })
  })

  it('Sets the correct URL for a Publisher language search', () => {
    cy.visit('')
    cy.contains('button', 'Languages').click()
    cy.get('input#locale').type('Welsh')
    cy.get('.govuk-details__summary').click()
    cy.get('#area-publisher').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=language&lang=cy&area=publisher')
    })
  })

  it('Sets the correct URL for a Whitehall language search', () => {
    cy.visit('')
    cy.contains('button', 'Languages').click()
    cy.get('input#locale').type('Welsh')
    cy.get('.govuk-details__summary').click()
    cy.get('#area-whitehall').check()
    cy.get('button#search').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('?search-type=language&lang=cy&area=whitehall')
    })
  })

  it('Resets to no Query String when going back to Keyword search (regression)', () => {
    cy.visit('')
    cy.contains('button', 'Links').click()
    cy.contains('button', 'Keywords').click()
    cy.location().should((loc) => {
      expect(loc.search).to.eq('')
    })
  })
})

describe('URL Reading', () => {
  it('Sets the correct inputs for a link search', () => {
    cy.visit('?search-type=link&link-search-url=%2Fmaternity-pay-leave')
    cy.get('#search-link.active')
    cy.get('#link-search')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('/maternity-pay-leave'))
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a link search in whitehall', () => {
    cy.visit('?search-type=link&link-search-url=youtube.com&area=whitehall')
    cy.get('#search-link.active')
    cy.get('#link-search')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('youtube.com'))
    cy.get('#area-whitehall').should('be.checked')
  })

  it('Sets the correct inputs for a default keyword search', () => {
    cy.visit('?selected-words=wwekufsskjfdksufweuf')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('wwekufsskjfdksufweuf'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a keyword search in title only', () => {
    cy.visit('?selected-words=Churchill&search-in-text=false')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Churchill'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('not.be.checked')
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a keyword search in body only', () => {
    cy.visit('?selected-words=Churchill&search-in-title=false')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Churchill'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('not.be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a keyword search in neither title nor body', () => {
    cy.visit(
      '?selected-words=Churchill&search-in-title=false&search-in-text=false'
    )
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Churchill'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('not.be.checked')
    cy.get('#search-text').should('not.be.checked')
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a keyword search in Publisher only', () => {
    cy.visit('?selected-words=education&area=publisher')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('education'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-publisher').should('be.checked')
  })

  it('Sets the correct inputs for a keyword search in Whitehall only', () => {
    cy.visit('?selected-words=education&area=whitehall')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('education'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-whitehall').should('be.checked')
  })

  it('Sets the correct inputs for an empty case-sensitive keyword search', () => {
    cy.visit('?selected-words=edUcatIon&case-sensitive=true')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('edUcatIon'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-whitehall').should('not.be.checked')
  })

  it('Sets the correct inputs for an "any keywords" search', () => {
    cy.visit('?selected-words=sunak+disraeli&combinator=any')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('sunak disraeli'))
    cy.get('#combinator-any').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-whitehall').should('not.be.checked')
  })

  it('Sets the correct inputs for an "all keywords" search', () => {
    cy.visit('?selected-words=sunak+disraeli&combinator=all')
    cy.get('#search-keyword.active')
    cy.get('#keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('sunak disraeli'))
    cy.get('#combinator-all').should('be.checked')
    cy.get('#excluded-keyword')
      .invoke('val')
      .then((value) => expect(value).to.be.eq(''))
    cy.get('#case-sensitive').should('not.be.checked')
    cy.get('#search-title').should('be.checked')
    cy.get('#search-text').should('be.checked')
    cy.get('#area-whitehall').should('not.be.checked')
  })

  it('Sets the correct inputs for a taxon search', () => {
    cy.visit('?search-type=taxon&selected-taxon=Environment')
    cy.get('#search-taxon.active')
    cy.get('#taxon')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Environment'))
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a Publisher taxon search', () => {
    cy.visit('?search-type=taxon&selected-taxon=Environment&area=publisher')
    cy.get('#search-taxon.active')
    cy.get('#taxon')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Environment'))
    cy.get('#area-publisher').should('be.checked')
  })

  it('Sets the correct inputs for a Whitehall taxon search', () => {
    cy.visit('?search-type=taxon&selected-taxon=Environment&area=whitehall')
    cy.get('#search-taxon.active')
    cy.get('#taxon')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('Environment'))
    cy.get('#area-whitehall').should('be.checked')
  })

  it('Sets the correct inputs for a language search', () => {
    cy.visit('?search-type=language&lang=de')
    cy.get('#search-language.active')
    cy.get('#locale')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('German'))
    cy.get('#area-any').should('be.checked')
  })

  it('Sets the correct inputs for a language search in Publisher', () => {
    cy.visit('?search-type=language&lang=de&area=publisher')
    cy.get('#search-language.active')
    cy.get('#locale')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('German'))
    cy.get('#area-publisher').should('be.checked')
  })

  it('Sets the correct inputs for a language search in Whitehall', () => {
    cy.visit('?search-type=language&lang=de&area=whitehall')
    cy.get('#search-language.active')
    cy.get('#locale')
      .invoke('val')
      .then((value) => expect(value).to.be.eq('German'))
    cy.get('#area-whitehall').should('be.checked')
  })

  // TODO: unknown parameters
  // TODO: parameters shuffled
  // TODO: repeated parameters
  // TODO: bad parameter values
  // TODO: malformed QSP
})
