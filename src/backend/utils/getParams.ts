import * as express from 'express'
import {
  SearchParams,
  Combinator,
  SearchArea,
  SearchType,
  KeywordLocation,
} from '../../common/types/search-api-types'
import { sanitiseInput } from '../../common/utils/utils'

export const getParams = (req: express.Request): SearchParams => {
  const searchType = <SearchType>(
    (sanitiseInput(req.query['search-type'] as string) || SearchType.Keyword)
  )
  const selectedWords =
    sanitiseInput(req.query['selected-words'] as string) || ''
  const excludedWords =
    sanitiseInput(req.query['excluded-words'] as string) || ''
  const selectedTaxon =
    sanitiseInput(req.query['selected-taxon'] as string) || ''
  const selectedOrganisation =
    sanitiseInput(req.query['selected-organisation'] as string) || ''
  const selectedLocale = sanitiseInput(req.query.lang as string) || ''
  const caseSensitive = req.query['case-sensitive'] === 'true'
  const combinator = <Combinator>(
    (sanitiseInput(req.query.combinator as string) || Combinator.All)
  )

  const getKeywordLocationFromQuery = () => {
    if (req.query['search-in-all'] === 'true') return KeywordLocation.All
    if (req.query['search-in-title'] === 'true') return KeywordLocation.Title
    if (req.query['search-in-text'] === 'true')
      return KeywordLocation.BodyContent
    if (req.query['search-in-description'] === 'true')
      return KeywordLocation.Description
    return KeywordLocation.All
  }
  const keywordLocation = getKeywordLocationFromQuery()

  const areaToSearch = <SearchArea>(
    (sanitiseInput(req.query.area as string) || SearchArea.Any)
  )
  const linkSearchUrl =
    sanitiseInput(req.query['link-search-url'] as string) || ''
  return {
    searchType,
    selectedWords,
    excludedWords,
    selectedTaxon,
    selectedOrganisation,
    selectedLocale,
    caseSensitive,
    combinator,
    keywordLocation,
    areaToSearch,
    linkSearchUrl,
  }
}

export default getParams
