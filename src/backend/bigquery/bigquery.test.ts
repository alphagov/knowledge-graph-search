import {
  Combinator,
  KeywordLocation,
  PublishingStatus,
  PoliticalStatus,
  SearchParams,
  SearchType,
} from '../../common/types/search-api-types'
import * as buildSqlQuery from './buildSqlQuery'
import { bigQuery, sendInitQuery, sendSearchQuery } from './bigquery'
import { BigQuery } from '@google-cloud/bigquery'
import { expect, it } from '@jest/globals'

jest.mock('@google-cloud/bigquery', () => {
  class BigQueryMock {
    private config: any
    constructor(config: any) {
      this.config = config
    }

    query() {
      return [1, 2, 3]
    }
  }
  BigQueryMock.prototype.query = jest.fn()
  return {
    BigQuery: BigQueryMock,
  }
})

beforeEach(() => {
  jest.resetAllMocks()
})

describe('[Function] bigQuery', () => {
  it('should call bigquery with the correct parameters from the given options', async () => {
    const options = {
      keywords: ['keyword1', 'keyword2'],
      excludedKeywords: ['excluded1', 'excluded2'],
      name: 'name',
      locale: 'locale',
      taxon: 'taxon',
      organisation: 'organisation',
      link: 'link',
    }
    ;(BigQuery.prototype.query as jest.Mock).mockResolvedValue([1, 2, 3])
    await bigQuery('query', options)

    expect(BigQuery.prototype.query).toHaveBeenCalledTimes(1)
    expect(BigQuery.prototype.query).toHaveBeenCalledWith({
      query: 'query',
      location: 'europe-west2',
      params: {
        keyword0: 'keyword1',
        keyword1: 'keyword2',
        excluded_keyword0: 'excluded1',
        excluded_keyword1: 'excluded2',
        name: 'name',
        locale: 'locale',
        taxon: 'taxon',
        organisation: 'organisation',
        link: 'link',
      },
    })
  })
})

describe('[Function] sendInitQuery', () => {
  it('should call bigQuery with the correct parameters', async () => {
    ;(BigQuery.prototype.query as jest.Mock)
      .mockResolvedValueOnce([
        [{ locale: 'fr' }, { locale: 'en' }, { locale: 'de' }],
      ])
      .mockResolvedValueOnce([
        [{ name: 'taxon1' }, { name: 'taxon2' }, { name: 'taxon3' }],
      ])
      .mockResolvedValueOnce([
        [{ title: 'org1' }, { title: 'org2' }, { title: 'org3' }],
      ])
      .mockResolvedValueOnce([
        [
          { document_type: 'dt1' },
          { document_type: 'dt2' },
          { document_type: 'dt3' },
        ],
      ])
      .mockResolvedValueOnce([
        [{ title: 'gov1' }, { title: 'gov2' }, { title: 'gov3' }],
      ])
      .mockResolvedValueOnce([
        [
          { publishing_app: 'app`' },
          { publishing_app: 'app2' },
          { publishing_app: 'app3' },
        ],
      ])
      .mockResolvedValueOnce([[{ title: 'Mr Something' }]])
    const result = await sendInitQuery()

    expect(BigQuery.prototype.query).toHaveBeenCalledTimes(7)

    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(1, {
      query: `
        SELECT DISTINCT locale
        FROM \`search.locale\`
        `,
      location: 'europe-west2',
      params: {},
    })
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(2, {
      query: `
        SELECT DISTINCT name
        FROM \`search.taxon\`
        `,
      location: 'europe-west2',
      params: {},
    })
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(3, {
      query: `
        SELECT DISTINCT title
        FROM \`search.organisation\`
        `,
      location: 'europe-west2',
      params: {},
    })
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(4, {
      query: `
        SELECT DISTINCT document_type
        FROM \`search.document_type\`
        `,
      location: 'europe-west2',
      params: {},
    })
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(5, {
      query: `
        SELECT DISTINCT title
        FROM \`search.government\`
        `,
      location: 'europe-west2',
      params: {},
    })

    expect(result).toEqual({
      locales: ['', 'en', 'cy', 'fr', 'de'],
      taxons: ['taxon1', 'taxon2', 'taxon3'],
      organisations: ['org1', 'org2', 'org3'],
      documentTypes: ['dt1', 'dt2', 'dt3'],
      governments: ['gov1', 'gov2', 'gov3'],
      publishingApps: ['app`', 'app2', 'app3'],
      persons: ['Mr Something'],
    })
  })
})

describe('[Function] sendSearchQuery', () => {
  const makeSearchParams = (options = {}) =>
    ({
      searchType: SearchType.Advanced,
      selectedWords: 'keyword1 keyword2',
      excludedWords: 'excluded1 excluded2',
      taxon: 'taxon',
      publishingOrganisation: 'organisation',
      language: 'en',
      documentType: '',
      linkSearchUrl: 'link',
      keywordLocation: KeywordLocation.All,
      combinator: Combinator.Any,
      publishingApp: '',
      caseSensitive: false,
      publishingStatus: PublishingStatus.All,
      politicalStatus: PoliticalStatus.Any,
      government: '',
      ...options,
    } as SearchParams)

  it('Calls the appropriate queries with default search type', async () => {
    jest.spyOn(buildSqlQuery, 'buildSqlQuery').mockReturnValue('query')
    ;(BigQuery.prototype.query as jest.Mock)
      .mockResolvedValueOnce(['Some result'])
      .mockResolvedValueOnce(['Some result'])
    await sendSearchQuery(makeSearchParams())
    expect(BigQuery.prototype.query).toHaveBeenCalledTimes(1)
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(1, {
      query: 'query',
      location: 'europe-west2',
      params: {
        excluded_keyword0: 'excluded1',
        excluded_keyword1: 'excluded2',
        politicalStatus: 'any',
        keyword0: 'keyword1',
        keyword1: 'keyword2',
        link: 'link',
        locale: 'en',
        organisation: 'organisation',
        taxon: 'taxon',
      },
    })
  })
  it('Calls the appropriate queries with Taxon search type', async () => {
    jest.spyOn(buildSqlQuery, 'buildSqlQuery').mockReturnValue('query')
    ;(BigQuery.prototype.query as jest.Mock)
      .mockResolvedValueOnce(['Some result'])
      .mockResolvedValueOnce(['Some result'])
    await sendSearchQuery(makeSearchParams({ searchType: SearchType.Taxon }))
    expect(BigQuery.prototype.query).toHaveBeenCalledTimes(1)
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(1, {
      query: 'query',
      location: 'europe-west2',
      params: {
        excluded_keyword0: 'excluded1',
        excluded_keyword1: 'excluded2',
        politicalStatus: 'any',
        keyword0: 'keyword1',
        keyword1: 'keyword2',
        link: 'link',
        locale: 'en',
        organisation: 'organisation',
        taxon: 'taxon',
      },
    })
  })
  it('Calls the appropriate queries with Organisation search type', async () => {
    jest.spyOn(buildSqlQuery, 'buildSqlQuery').mockReturnValue('query')
    ;(BigQuery.prototype.query as jest.Mock)
      .mockResolvedValueOnce(['Some result'])
      .mockResolvedValueOnce(['Some result'])
    await sendSearchQuery(
      makeSearchParams({ searchType: SearchType.Organisation })
    )
    expect(BigQuery.prototype.query).toHaveBeenCalledTimes(1)
    expect(BigQuery.prototype.query).toHaveBeenNthCalledWith(1, {
      query: 'query',
      location: 'europe-west2',
      params: {
        excluded_keyword0: 'excluded1',
        excluded_keyword1: 'excluded2',
        politicalStatus: 'any',
        keyword0: 'keyword1',
        keyword1: 'keyword2',
        link: 'link',
        locale: 'en',
        organisation: 'organisation',
        taxon: 'taxon',
      },
    })
  })
})
