import {
  SearchParams,
  Combinator,
  SearchType,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
} from '../../common/types/search-api-types'
import { buildSqlQuery } from './buildSqlQuery'
import { expect } from '@jest/globals'

const prefix = (keywords?: string[], link?: string) => `
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
    organisations AS all_organisations,
    government,
    is_political,
    people,
    [${
      keywords?.length
        ? `STRUCT(
               @keyword0 AS keyword,
               DIV(
                 (SELECT (LENGTH(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, "")) - LENGTH(REPLACE(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0, '')))),
                 LENGTH(@keyword0)
               ) AS occurrences
             ), STRUCT(
               @keyword1 AS keyword,
               DIV(
                 (SELECT (LENGTH(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, "")) - LENGTH(REPLACE(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1, '')))),
                 LENGTH(@keyword1)
               ) AS occurrences
             )`
        : ''
    }${keywords?.length && link !== undefined ? ', ' : ''}${
  link !== undefined
    ? `STRUCT(
      @link AS keyword,
      (SELECT COUNT(1) FROM UNNEST(hyperlinks) as hyperlink WHERE CONTAINS_SUBSTR(hyperlink.link_url, @link)) AS occurrences)`
    : ''
}] AS occurrences,
    FROM search.pageWHERE TRUE`

const SUFFIX = `ORDER BY page_views DESC
  LIMIT 10000`

const expectedQuery = (clauses: string, keywords?: string[], link?: string) =>
  `${prefix(keywords, link)}${clauses}${SUFFIX}`

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
    publishingApp: '',
    caseSensitive: false,
    publishingStatus: PublishingStatus.All,
    government: '',
    politicalStatus: PoliticalStatus.Any,
    associatedPerson: '',
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
    const searchParams: SearchParams = makeParams({ caseSensitive: true })
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = []
    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1) <> 0)`
    const expected = expectedQuery(expectedClauses, keywords)
    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('deals with case sensitive keywords', () => {
    const searchParams: SearchParams = makeParams({ caseSensitive: true })
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)

    const expectedClauses = `\nAND (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1) <> 0)`
    const expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('has exclude clause if exclude keywords are provided', () => {
    const searchParams: SearchParams = makeParams()
    const keywords: string[] = []
    const excludedKeywords: string[] = ['test1', 'test2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND NOT (CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) OR CONTAINS_SUBSTR(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1))`
    const expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('deals with case sensitive excluded keywords', () => {
    const searchParams: SearchParams = makeParams({ caseSensitive: true })
    const keywords: string[] = []
    const excludedKeywords: string[] = ['excluded1', 'excluded2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND NOT (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1) <> 0)`
    const expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by publishing app', () => {
    let searchParams: SearchParams = makeParams({
      publishingApp: 'publisher',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    let query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    let expectedClauses = `\nAND publishing_app = @publishingApp`
    let expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))

    searchParams = makeParams({ publishingApp: 'whitehall' })
    query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    expectedClauses = `\nAND publishing_app = @publishingApp`
    expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by political status', () => {
    const searchParams: SearchParams = makeParams({
      politicalStatus: 'not-political',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND is_political = (@politicalStatus = 'political')`
    const expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by government', () => {
    const searchParams: SearchParams = makeParams({
      government: '2015 Conservative government',
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `\nAND government = @government`
    const expected = expectedQuery(expectedClauses, keywords)

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
    const expected = expectedQuery(expectedClauses, keywords)

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
    )`
    const expected = expectedQuery(expectedClauses, keywords)

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
    )`
    const expected = expectedQuery(expectedClauses, keywords)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can filter by any hyperlink', () => {
    const link = 'whatever'
    const searchParams: SearchParams = makeParams({
      linkSearchUrl: link,
    })
    const keywords: string[] = []
    const excludedKeywords: string[] = []

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
    const expectedClauses = `
    AND EXISTS
    (
      SELECT 1 FROM UNNEST (hyperlinks) AS link
      WHERE CONTAINS_SUBSTR(link.link_url, @link)
    )`
    const expected = expectedQuery(expectedClauses, keywords, link)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })

  it('can mix all the clauses together', () => {
    const link = 'whatever'
    const searchParams: SearchParams = makeParams({
      caseSensitive: true,
      publishingApp: 'whitehall',
      politicalStatus: 'political',
      language: 'whatever',
      taxon: 'whatever',
      publishingOrganisation: 'whatever',
      linkSearchUrl: link,
      government: '2015 Conservative government',
      associatedPerson: 'hello',
    })
    const keywords: string[] = ['test1', 'test2']
    const excludedKeywords: string[] = ['excluded1', 'excluded2']

    const query = buildSqlQuery(searchParams, keywords, excludedKeywords)

    const expectedClauses = `
  AND (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @keyword1) <> 0)
  AND NOT (STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword0) <> 0 OR STRPOS(IFNULL(page.title, "") || " " || IFNULL(page.text, "") || " " || IFNULL(page.description, ""), @excluded_keyword1) <> 0)
  AND publishing_app = @publishingApp
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
  AND is_political = (@politicalStatus = 'political')
  AND government = @government
   AND EXISTS
    (
      SELECT 1 FROM UNNEST (people) AS person
      WHERE person = @associatedPerson
    )`
    const expected = expectedQuery(expectedClauses, keywords, link)

    expect(queryFmt(query)).toEqual(queryFmt(expected))
  })
})
