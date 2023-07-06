import { bigQuery } from './bigquery'
import { BigQuery } from '@google-cloud/bigquery'
import { expect } from '@jest/globals'

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
      selectedWordsWithoutQuotes: 'selectedWordsWithoutQuotes',
    }

    jest.spyOn(BigQuery.prototype, 'query').mockResolvedValueOnce(['rows'])

    await bigQuery('query', options)

    expect(BigQuery.prototype.query).toHavebeenCalledTimes(1)
  })
})
