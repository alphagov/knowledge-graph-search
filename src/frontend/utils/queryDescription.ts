import {
  KeywordLocation,
  SearchParams,
} from '../../common/types/search-api-types'
import { languageName } from '../../common/utils/lang'
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
      `belong to the ${makeBold(
        searchParams.taxon,
        includeMarkup
      )} taxon (or its sub-taxons)`
    )
  if (searchParams.publishingOrganisation !== '')
    clauses.push(
      `are published by the ${makeBold(
        searchParams.publishingOrganisation,
        includeMarkup
      )}`
    )
  if (searchParams.language !== '')
    clauses.push(
      `are in ${makeBold(languageName(searchParams.language), includeMarkup)}`
    )
  if (searchParams.linkSearchUrl !== '')
    clauses.push(
      `link to ${makeBold(searchParams.linkSearchUrl, includeMarkup)}`
    )
  if (
    searchParams.publishingApplication === 'whitehall' ||
    searchParams.publishingApplication === 'publisher'
  )
    clauses.push(
      `are published using ${makeBold(
        searchParams.publishingApplication,
        includeMarkup
      )}`
    )

  const joinedClauses =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, clauses.length - 1).join(', ')} and ${
          clauses[clauses.length - 1]
        }`

  const prefix = waiting
    ? 'Searching for'
    : `${nbRecords} result${nbRecords !== 0 ? 's' : ''} for`
  return `${prefix} pages that ${joinedClauses}`
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
