import { Request } from 'express'
import { getParams } from './getParams'
import { expect } from '@jest/globals'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getParams', () => {
  it('Should return the parameters', () => {
    const req = {
      query: {
        'search-type': 'some search-type',
        'selected-words': 'some selected-words',
        'excluded-words': 'some excluded-words',
        taxon: 'some taxon',
        'publishing-organisation': 'some publishing-organisation',
        language: 'some language',
        'case-sensitive': 'true',
        combinator: 'some combinator',
        'keyword-location': 'some keyword-location',
        'publishing-application': 'some publishing-application',
        'link-search-url': 'some link-search-url',
        'document-type': 'some document-type',
        'phone-number': 'some phone-number',
        'publishing-status': 'some publishing-status',
        'political-status': 'political',
        government: 'some government',
      },
    } as unknown as Request

    expect(getParams(req)).toStrictEqual({
      combinator: 'some combinator',
      searchType: 'some search-type',
      selectedWords: 'some selected-words',
      excludedWords: 'some excluded-words',
      taxon: 'some taxon',
      publishingOrganisation: 'some publishing-organisation',
      caseSensitive: true,
      documentType: 'some document-type',
      keywordLocation: 'some keyword-location',
      linkSearchUrl: 'some link-search-url',
      phoneNumber: 'some phone-number',
      publishingApp: 'some publishing-application',
      publishingStatus: 'some publishing-status',
      language: 'some language',
      politicalStatus: 'political',
      government: 'some government',
      linksExactMatch: false,
      associatedPerson: '',
    })
  })

  it('Should return the parameters with empty values', () => {
    const req = {
      query: {
        'search-type': '',
        'selected-words': '',
        'excluded-words': '',
        taxon: '',
        'publishing-organisation': '',
        language: '',
        'case-sensitive': 'true',
        combinator: '',
        'keyword-location': '',
        'publishing-application': '',
        'link-search-url': '',
        'document-type': '',
        'publishing-status': '',
        'is-political': '',
        government: '',
        'associated-person': '',
      },
    } as unknown as Request
    console.log({ 'getParams(req)': getParams(req) })

    expect(getParams(req)).toStrictEqual({
      publishingApp: '',
      caseSensitive: true,
      combinator: 'all',
      excludedWords: '',
      linkSearchUrl: '',
      phoneNumber: '',
      searchType: 'keyword',
      language: '',
      publishingOrganisation: '',
      publishingStatus: '',
      taxon: '',
      selectedWords: '',
      keywordLocation: 'all',
      documentType: '',
      politicalStatus: 'any',
      government: '',
      linksExactMatch: false,
      associatedPerson: '',
    })
  })
})
