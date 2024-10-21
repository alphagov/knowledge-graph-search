import { Sorting } from '../types/state-types'
import { fieldName, sortOrder } from '../view/utils'
import {
  KeywordLocation,
  PoliticalStatus,
  PublishingStatus,
  SearchParams,
} from '../../common/types/search-api-types'
import {
  defaultAllLanguagesOption,
  languageName,
} from '../../common/utils/lang'
import { splitKeywords } from '../../common/utils/utils'
import { makeBold } from './makeBold'

type QueryDescriptionParams = {
  searchParams: SearchParams
  nbRecords?: number
  includeMarkup?: boolean
  waiting?: boolean
}

export const queryDescription = ({
  searchParams,
  nbRecords = 0,
  includeMarkup = true,
  waiting = false,
}: QueryDescriptionParams) => {
  const clauses = []
  if (searchParams.selectedWords !== '') {
    let keywords = ` contain ${containDescription(searchParams, includeMarkup)}`
    if (searchParams.excludedWords !== '') {
      keywords = `${keywords} (but don't contain ${makeBold(
        searchParams.excludedWords,
        includeMarkup
      )})`
    }
    clauses.push(keywords)
  }
  if (searchParams.taxon !== '')
    clauses.push(
      `belong to the ${makeBold(searchParams.taxon, includeMarkup)} topic tag`
    )
  if (searchParams.publishingOrganisation !== '')
    clauses.push(
      `are published by the ${makeBold(
        searchParams.publishingOrganisation,
        includeMarkup
      )}`
    )
  if (searchParams.publishingStatus !== PublishingStatus.All) {
    const status = {
      [PublishingStatus.Withdrawn]: 'withdrawn',
      [PublishingStatus.NotWithdrawn]: 'not withdrawn',
    }[searchParams.publishingStatus]
    clauses.push(`are ${makeBold(status, includeMarkup)}`)
  }
  if (
    searchParams.language !== defaultAllLanguagesOption &&
    searchParams.language !== ''
  )
    clauses.push(
      `are in ${makeBold(languageName(searchParams.language), includeMarkup)}`
    )
  if (searchParams.linkSearchUrl !== '') {
    const isSlug = searchParams.linkSearchUrl.startsWith('/')
    const formattedLink = isSlug
      ? `https://www.gov.uk${searchParams.linkSearchUrl}`
      : searchParams.linkSearchUrl
    let clause = `link to ${makeBold(formattedLink, includeMarkup)}`
    if (searchParams.linksExactMatch) {
      clause = `${clause} (exact match)`
    }
    clauses.push(clause)
  }
  if (searchParams.phoneNumber !== '')
    clauses.push(
      `mention the phone number ${makeBold(
        searchParams.phoneNumber,
        includeMarkup
      )}`
    )
  if (searchParams.publishingApp !== '')
    clauses.push(
      `are published using ${makeBold(
        searchParams.publishingApp,
        includeMarkup
      )}`
    )
  if (
    searchParams.politicalStatus &&
    searchParams.politicalStatus !== PoliticalStatus.Any
  ) {
    const status = {
      [PoliticalStatus.Political]: 'political',
      [PoliticalStatus.NotPolitical]: 'not political',
    }[searchParams.politicalStatus]
    clauses.push(`are ${makeBold(status, includeMarkup)}`)
  }

  if (searchParams.government !== '') {
    clauses.push(
      `were published by the ${makeBold(
        searchParams.government,
        includeMarkup
      )}`
    )
  }

  if (searchParams.associatedPerson !== '') {
    clauses.push(
      `are associated with the person ${makeBold(
        searchParams.associatedPerson,
        includeMarkup
      )}`
    )
  }

  const joinedClauses =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, clauses.length - 1).join(', ')} and ${
          clauses[clauses.length - 1]
        }`

  // The sort order description gets written directly into the DOM by the AgGrid
  // onSortChanged event handler.
  const sortOrderClause = '<span id="sort-description"/>'

  const prefix = waiting
    ? 'Searching for'
    : nbRecords
    ? `${makeBold(`${nbRecords} result${nbRecords > 1 ? 's' : ''}`, true)} for`
    : ''
  return `${prefix} pages that ${joinedClauses.trim()}${sortOrderClause}.`
}

// combinedWords as used here must be exactly the same set of keywords as the ones submitted to BigQuery by the function sendSearchQuery.
const containDescription = (search: SearchParams, includeMarkup: boolean) => {
  let where = ''
  if (search.keywordLocation === KeywordLocation.Title) {
    where = 'in their title'
  } else if (search.keywordLocation === KeywordLocation.BodyContent) {
    where = 'in their body content'
  } else if (search.keywordLocation === KeywordLocation.Description) {
    where = 'in their description'
  }
  const combineOp = search.combinator === 'all' ? 'and' : 'or'
  const combinedWords = splitKeywords(search.selectedWords)
    .map((w) => makeBold(w, includeMarkup))
    .join(` ${combineOp} `)
  return search.selectedWords !== '' ? `${combinedWords} ${where}` : ''
}

export const sortDescription = (sorting: Sorting) => {
  const isSorted = Object.keys(sorting).length !== 0
  if (!isSorted) {
    return ''
  }
  const numberOfSortedColumns = Object.entries(sorting).length
  const description = Object.entries(sorting)
    // Rearrange into something that can be ordered by sortIndex
    .map(([k, v]) => ({
      name: k,
      // The final column has a null sortIndex at this point, for some reason
      index: v.sortIndex != null ? v.sortIndex + 1 : numberOfSortedColumns,
      order: v.sort,
    }))
    // Reorder by sortIndex
    .sort(function (a, b) {
      if (a.index + 0 === b.index + 0) return 0
      return a.index + 0 > b.index + 0 ? 1 : -1
    })
    // Compose the description
    .map((field) => `"${fieldName(field.name)}" (${sortOrder(field.order)})`)
    .join(`, then by `)
  return `, sorted by ${description}`
}
