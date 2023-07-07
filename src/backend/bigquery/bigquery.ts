// todo: split into models

import {
  Transaction,
  Taxon,
  Organisation,
  Person,
  Role,
  MetaResultType,
  MetaResult,
  MainResult,
  SearchParams,
  SearchResults,
  SearchType,
  InitResults,
  BankHoliday,
} from '../../common/types/search-api-types'
import { splitKeywords } from '../../common/utils/utils'
import { languageCode } from '../../common/utils/lang'
import { BigQuery } from '@google-cloud/bigquery'
import config from '../config'
import log from '../utils/logging'
import { buildSqlQuery } from './buildSqlQuery'

//= ===== private ======

const bigquery = new BigQuery({
  projectId: config.projectId,
})

export const bigQuery = async function (userQuery: string, options?: any) {
  const params: Record<string, string> = {}

  if (options) {
    if (options.keywords) {
      options.keywords.forEach(
        (keyword: string, index: number) =>
          (params[`keyword${index}`] = keyword)
      )
    }
    if (options.excludedKeywords) {
      options.excludedKeywords.forEach(
        (keyword: string, index: number) =>
          (params[`excluded_keyword${index}`] = keyword)
      )
    }
    if (options.name) {
      params.name = options.name
    }
    if (options.locale) {
      params.locale = options.locale
    }
    if (options.taxon) {
      params.taxon = options.taxon
    }
    if (options.organisation) {
      params.organisation = options.organisation
    }
    if (options.link) {
      params.link = options.link
    }
    if (options.selectedWordsWithoutQuotes !== undefined) {
      params.selected_words_without_quotes = options.selectedWordsWithoutQuotes
    }
  }

  const bqOptions = {
    query: userQuery,
    location: 'europe-west2',
    params,
  }

  const [rows] = await bigquery.query(bqOptions)

  return rows
}

//= ===== public ======

const sendInitQuery = async function (): Promise<InitResults> {
  let bqLocales: any, bqTaxons: any, bqOrganisations: any
  try {
    ;[bqLocales, bqTaxons, bqOrganisations] = await Promise.all([
      bigQuery(`
        SELECT DISTINCT locale
        FROM \`content.locale\`
        `),
      bigQuery(`
        SELECT name
        FROM \`search.taxon\`
        `),
      bigQuery(`
        SELECT DISTINCT title
        FROM \`graph.organisation\`
        `),
    ])
  } catch (error) {
    log.error(error, 'Error in sendInitQueryError')
  }
  return {
    locales: ['', 'en', 'cy'].concat(
      bqLocales
        .map((row: any) => row.locale)
        .filter((locale: string) => locale !== 'en' && locale !== 'cy')
    ),
    taxons: bqTaxons.map((taxon: any) => taxon.name),
    organisations: bqOrganisations.map(
      (organisation: any) => organisation.title
    ),
  }
}

const getTaxonInfo = async function (name: string): Promise<Taxon[]> {
  return await bigQuery(
    `SELECT "Taxon" as type, * FROM search.taxon WHERE lower(name) = lower(@name);`,
    { name }
  )
}

const getOrganisationInfo = async function (
  name: string
): Promise<Organisation[]> {
  return await bigQuery(
    `SELECT "Organisation" as type, * FROM search.organisation WHERE lower(name) = lower(@name);`,
    { name }
  )
}

const getBankHolidayInfo = async function (
  name: string
): Promise<BankHoliday[]> {
  const bqBankHolidays: BankHoliday[] = await bigQuery(
    `SELECT * FROM search.bank_holiday WHERE lower(name) = lower(@name);`,
    { name }
  )
  return bqBankHolidays.map((bqBankHoliday: BankHoliday) => {
    return {
      type: MetaResultType.BankHoliday,
      name: bqBankHoliday.name,
      dates: bqBankHoliday.dates.map((date: any) => date.value),
      divisions: bqBankHoliday.divisions,
    }
  })
}

const getTransactionInfo = async function (
  name: string
): Promise<Transaction[]> {
  return await bigQuery(
    `SELECT "Transaction" as type, * FROM search.transaction WHERE lower(name) = lower(@name);`,
    { name }
  )
}

const getRoleInfo = async function (name: string): Promise<Role[]> {
  return await bigQuery(
    `SELECT "Role" as type, * FROM search.role WHERE lower(name) = lower(@name);`,
    { name }
  )
}

const getPersonInfo = async function (name: string): Promise<Person[]> {
  return await bigQuery(
    `SELECT "Person" as type, * FROM search.person WHERE lower(name) = lower(@name);`,
    { name }
  )
}

// keywords as used here must be exactly the same set of combinedWords as used by the function containDescription.
const sendSearchQuery = async function (
  searchParams: SearchParams
): Promise<SearchResults> {
  const keywords = splitKeywords(searchParams.selectedWords)
  const excludedKeywords = splitKeywords(searchParams.excludedWords)
  const query = buildSqlQuery(searchParams, keywords, excludedKeywords)
  const locale = languageCode(searchParams.selectedLocale)
  const taxon = searchParams.selectedTaxon
  const organisation = searchParams.selectedOrganisation
  const selectedWordsWithoutQuotes = searchParams.selectedWords.replace(
    /"/g,
    ''
  )
  console.log({ query })
  const link = searchParams.linkSearchUrl
  const queries = [
    bigQuery(query, {
      keywords,
      excludedKeywords,
      locale,
      taxon,
      organisation,
      link,
    }),
  ]

  let bqMetaResults: MetaResult[] = []
  let bqMainResults: MainResult[] = []
  let results: unknown[][]

  switch (searchParams.searchType) {
    case SearchType.Taxon:
      results = await Promise.all(queries)
      bqMainResults = results[0]
      bqMetaResults = await getTaxonInfo(searchParams.selectedTaxon)
      break
    case SearchType.Organisation:
      results = await Promise.all(queries)
      bqMainResults = results[0]
      bqMetaResults = await getOrganisationInfo(
        searchParams.selectedOrganisation
      )
      break
    default:
      if (
        selectedWordsWithoutQuotes &&
        selectedWordsWithoutQuotes.length > 5 &&
        selectedWordsWithoutQuotes.includes(' ')
      ) {
        queries.push(
          bigQuery(
            `SELECT *
         FROM search.thing
         WHERE CONTAINS_SUBSTR(name, @selected_words_without_quotes)
         ;`,
            { selectedWordsWithoutQuotes }
          )
        )
      }
      results = await Promise.all(queries)
      bqMainResults = results[0]
      bqMetaResults = results.length > 1 ? (results[1] as MetaResult[]) : []
      break
  }
  const result: SearchResults = {
    main: bqMainResults,
    meta: bqMetaResults,
  }
  return result
}

export {
  getBankHolidayInfo,
  getTransactionInfo,
  getOrganisationInfo,
  getPersonInfo,
  getRoleInfo,
  getTaxonInfo,
  sendInitQuery,
  sendSearchQuery,
}
