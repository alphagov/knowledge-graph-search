import { SearchParams } from '../../common/types/search-api-types'
import { languageName } from '../../common/utils/lang'
import { splitKeywords } from '../../common/utils/utils'
import { makeBold } from './makeBold'

export const queryDescription = (
  search: SearchParams,
  includeMarkup = true
) => {
  const clauses = []
  if (search.selectedWords !== '') {
    let keywords = `contain ${containDescription(search, includeMarkup)}`
    if (search.excludedWords !== '') {
      keywords = `${keywords} (but don't contain ${makeBold(
        search.excludedWords,
        includeMarkup
      )})`
    }
    clauses.push(keywords)
  }
  if (search.selectedTaxon !== '')
    clauses.push(
      `belong to the ${makeBold(
        search.selectedTaxon,
        includeMarkup
      )} taxon (or its sub-taxons)`
    )
  if (search.selectedOrganisation !== '')
    clauses.push(
      `are published by the ${makeBold(
        search.selectedOrganisation,
        includeMarkup
      )}`
    )
  if (search.selectedLocale !== '')
    clauses.push(
      `are in ${makeBold(languageName(search.selectedLocale), includeMarkup)}`
    )
  if (search.linkSearchUrl !== '')
    clauses.push(`link to ${makeBold(search.linkSearchUrl, includeMarkup)}`)
  if (
    search.areaToSearch === 'whitehall' ||
    search.areaToSearch === 'publisher'
  )
    clauses.push(
      `are published using ${makeBold(search.areaToSearch, includeMarkup)}`
    )

  const joinedClauses =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, clauses.length - 1).join(', ')} and ${
          clauses[clauses.length - 1]
        }`

  return `pages that ${joinedClauses}`
}

// combinedWords as used here must be exactly the same set of keywords as the ones submitted to BigQuery by the function sendSearchQuery.
const containDescription = (search: SearchParams, includeMarkup: boolean) => {
  let where: string
  if (search.whereToSearch.title && search.whereToSearch.text) {
    where = ''
  } else if (search.whereToSearch.title) {
    where = 'in their title'
  } else {
    where = 'in their body content'
  }
  const combineOp = search.combinator === 'all' ? 'and' : 'or'
  const combinedWords = splitKeywords(search.selectedWords)
    .map((w) => makeBold(w, includeMarkup))
    .join(` ${combineOp} `)
  return search.selectedWords !== '' ? `${combinedWords} ${where}` : ''
}
