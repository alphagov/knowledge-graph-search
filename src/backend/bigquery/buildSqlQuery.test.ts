import {
  SearchParams,
  Combinator,
  PublishingApplication,
  SearchType,
  KeywordLocation,
  PublishingStatus,
} from '../../common/types/search-api-types'
import { buildSqlQuery } from './buildSqlQuery'
import { expect } from '@jest/globals'

const PREFIX = `
  SELECT
    url,
    title,
    documentType,
    contentId,
    locale,
    publishing_app,
    first_published_at,
    public_updated_at,
    withdrawn_at,
    withdrawn_explanation,
    page_views,
    taxons,
    primary_organisation,
    organisations AS all_organisations
  FROM search.page
  
  WHERE TRUE`

const SUFFIX = `
  ORDER BY page_views DESC
  LIMIT 10000`

const expectedQuery = (clauses: string) => `${PREFIX}${clauses}${SUFFIX}`

// This test util is used to remove from a string:
// - leading and trailing whitespace
// - multiple newlines
// - tab indentations
const queryFmt = (query: string) =>
  query
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\n+/g, '\n')
    .trim()

const makeParams = (opts = {}) =>
  ({
    searchType: SearchType.Advanced,
    selectedWords: '',
    excludedWords: '',
    taxon: '',
    publishingOrganisation: '',
    language: '',
    documentType: '',
    linkSearchUrl: '',
    keywordLocation: KeywordLocation.All,
    combinator: Combinator.Any,
    publishingApplication: PublishingApplication.Any,
    caseSensitive: false,
    publishingStatus: PublishingStatus.All,
    ...opts,
  } as SearchParams)

describe('buildSqlQuery', () => {
  it('has no include clause if no keywords are provided', () => {
    const searchParams: SearchParams = makeParams()
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expected = expectedQuery('')

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('has include clause if keywords are provided', () => {
    const searchParams: SearchParams = makeParams()
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)

    const expectedClauses = `\nAND (CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) OR CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1))`
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('deals with case sensitive keywords', () => {
    const searchParams: SearchParams = makeParams({ caseSensitive: true })
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)

    const expectedClauses = `\nAND (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1) <> 0)`
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('has exclude clause if exclude keywords are provided', () => {
    const searchParams: SearchParams = makeParams()
    const keywords: string[] = []
    const excludedKeywords: string[] = ['test1', 'test2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND NOT (CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) OR CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1))`
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('deals with case sensitive excluded keywords', () => {
    const searchParams: SearchParams = makeParams({ caseSensitive: true })
    const keywords: string[] = []
    const excludedKeywords: string[] = ['excluded1', 'excluded2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND NOT (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1) <> 0)`
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by publishing app', () => {
    let searchParams: SearchParams = makeParams({
      publishingApplication: 'publisher',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    let query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    let expectedClauses = `\nAND publishing_app = "publisher"`
    let expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))

    searchParams = makeParams({ publishingApplication: 'whitehall' })
    query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    expectedClauses = `\nAND publishing_app = "whitehall"`
    expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by any locale', () => {
    const searchParams: SearchParams = makeParams({
      language: 'whatever',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND locale = @locale`
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by any taxon', () => {
    const searchParams: SearchParams = makeParams({
      taxon: 'whatever',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `
    AND EXISTS
    (
      SELECT 1 FROM UNNEST (taxons) AS taxon
      WHERE taxon = @taxon
    )
    `
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by any organisation', () => {
    const searchParams: SearchParams = makeParams({
      publishingOrganisation: 'whatever',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `
    AND EXISTS
    (
      SELECT 1 FROM UNNEST (organisations) AS link
      WHERE link = @organisation
    )
    `
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by any hyperlink', () => {
    const searchParams: SearchParams = makeParams({
      linkSearchUrl: 'whatever',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `
    AND EXISTS
    (
      SELECT 1 FROM UNNEST (hyperlinks) AS link
      WHERE CONTAINS_SUBSTR(link.link_url, @link)
    )
    `
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can mix all the clauses togetuer', () => {
    const searchParams: SearchParams = makeParams({
      caseSensitive: true,
      publishingApplication: 'whitehall',
      language: 'whatever',
      taxon: 'whatever',
      publishingOrganisation: 'whatever',
      linkSearchUrl: 'whatever',
    })
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = ['excluded1', 'excluded2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)

    const expectedClauses = `
  AND (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1) <> 0)
  AND NOT (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1) <> 0)
  AND publishing_app = "whitehall"
  AND locale = @locale
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (taxons) AS taxon
      WHERE taxon = @taxon
    )
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (organisations) AS link
      WHERE link = @organisation
    )
  AND EXISTS
    (
      SELECT 1 FROM UNNEST (hyperlinks) AS link
      WHERE CONTAINS_SUBSTR(link.link_url, @link)
    )
  `
    const expected = expectedQuery(expectedClauses)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })
})
