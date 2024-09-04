import { queryDescription, sortDescription } from './queryDescription'
import { Sorting, SortAction } from '../types/state-types'
import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
  SearchParams,
  SearchType,
} from '../../common/types/search-api-types'
import { expect, it } from '@jest/globals'

jest.mock('../../common/utils/lang', () => ({
  languageName: jest.fn((lang) => lang),
}))

jest.mock('../../common/utils/utils', () => ({
  splitKeywords: jest.fn((words) => words.split(' ')),
}))

type PartialSearchParams = Partial<SearchParams>

const DEFAULT_SEARCH_PARAMS: SearchParams = {
  searchType: SearchType.Keyword,
  selectedWords: '',
  excludedWords: '',
  taxon: '',
  publishingOrganisation: '',
  language: '',
  documentType: '',
  linkSearchUrl: '',
  phoneNumber: '',
  keywordLocation: KeywordLocation.BodyContent,
  combinator: Combinator.All,
  publishingApp: 'whitehall',
  caseSensitive: false,
  publishingStatus: PublishingStatus.NotWithdrawn,
  politicalStatus: PoliticalStatus.Any,
  government: '',
  linksExactMatch: false,
  associatedPerson: '',
}

const makeParams = (overrides: PartialSearchParams = {}): SearchParams => {
  return { ...DEFAULT_SEARCH_PARAMS, ...overrides }
}

describe('queryDescription', () => {
  it('should generate description for selectedWords in title', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test word',
        keywordLocation: KeywordLocation.Title,
        combinator: Combinator.All,
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      `contain <span class="govuk-!-font-weight-bold">test</span> and <span class="govuk-!-font-weight-bold">word</span> in their title`
    )
  })

  it('should generate description for selectedWords and excludedWords', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test',
        excludedWords: 'demo',
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      `contain <span class="govuk-!-font-weight-bold">test</span> in their body content (but don't contain <span class="govuk-!-font-weight-bold">demo</span>)`
    )
  })

  it('should generate description for taxon', () => {
    const params = {
      searchParams: makeParams({
        taxon: 'science',
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'belong to the <span class="govuk-!-font-weight-bold">science</span> topic tag'
    )
  })

  it('should handle publishingStatus', () => {
    const params = {
      searchParams: makeParams({
        publishingStatus: PublishingStatus.Withdrawn,
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'are <span class="govuk-!-font-weight-bold">withdrawn</span>'
    )
  })

  it('should handle language', () => {
    const params = {
      searchParams: makeParams({
        language: 'English',
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'are in <span class="govuk-!-font-weight-bold">English</span>'
    )
  })

  it('should handle linkSearchUrl', () => {
    const params = {
      searchParams: makeParams({
        linkSearchUrl: 'https://example.com',
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'link to <span class="govuk-!-font-weight-bold">https://example.com</span>'
    )
  })

  it('should handle publishingApplication', () => {
    const params = {
      searchParams: makeParams({
        publishingApp: 'whitehall',
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'are published using <span class="govuk-!-font-weight-bold">whitehall</span>'
    )
  })

  it('should handle politicalStatus', () => {
    const params = {
      searchParams: makeParams({
        politicalStatus: PoliticalStatus.NotPolitical,
      }),
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'are <span class="govuk-!-font-weight-bold">not political</span>'
    )
  })

  it('should handle includeMarkup=false correctly', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test',
        keywordLocation: KeywordLocation.Title,
      }),
      includeMarkup: false,
    }

    const description = queryDescription(params)
    expect(description).toContain('contain "test" in their title')
    expect(description).not.toContain('<b>')
  })

  it('should handle multiple clauses', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test',
        keywordLocation: KeywordLocation.Title,
        taxon: 'science',
        language: 'English',
      }),
      includeMarkup: true,
    }

    const description = queryDescription(params)
    expect(description).toContain(
      'contain <span class="govuk-!-font-weight-bold">test</span> in their title, belong to the <span class="govuk-!-font-weight-bold">science</span> topic tag, are <span class="govuk-!-font-weight-bold">not withdrawn</span>, are in <span class="govuk-!-font-weight-bold">English</span>'
    )
  })

  it('should handle waiting prefix', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test',
      }),
      includeMarkup: true,
      waiting: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      'Searching for pages that contain <span class="govuk-!-font-weight-bold">test</span>'
    )
  })

  it('should handle nbRecords prefix', () => {
    const params = {
      searchParams: makeParams({
        selectedWords: 'test',
      }),
      nbRecords: 5,
      includeMarkup: true,
    }
    const description = queryDescription(params)
    expect(description).toContain(
      '<span class="govuk-!-font-weight-bold">5 results</span> for pages that contain <span class="govuk-!-font-weight-bold">test</span>'
    )
  })

  it('should describe the sort order', () => {
    const sorting: Sorting = {
      page_views: { sortIndex: 0, sort: SortAction.DESC },
    }
    const description = sortDescription(sorting)
    expect(description).toContain(', sorted by "Views (7days)" (descending)')
  })
})
