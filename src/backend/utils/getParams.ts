import * as express from 'express'
import {
  SearchParams,
  Combinator,
  PublishingApplication,
  SearchType,
  KeywordLocation,
  UrlParams,
  PublishingStatus,
} from '../../common/types/search-api-types'
import { sanitiseInput } from '../../common/utils/utils'

export const getParams = (req: express.Request): SearchParams => {
  const searchType = <SearchType>(
    (sanitiseInput(req.query[UrlParams.SearchType] as string) ||
      SearchType.Keyword)
  )
  const selectedWords =
    sanitiseInput(req.query[UrlParams.SelectedWords] as string) || ''
  const excludedWords =
    sanitiseInput(req.query[UrlParams.ExcludedWords] as string) || ''
  const selectedTaxon =
    sanitiseInput(req.query[UrlParams.SelectedTaxon] as string) || ''
  const selectedPublishingOrganisation =
    sanitiseInput(
      req.query[UrlParams.SelectedPublishingOrganisation] as string
    ) || ''
  const selectedLocale =
    sanitiseInput(req.query[UrlParams.Language] as string) || ''
  const caseSensitive = req.query[UrlParams.CaseSensitive] === 'true'
  const combinator = <Combinator>(
    (sanitiseInput(req.query.combinator as string) || Combinator.All)
  )
  const selectedDocumentType =
    sanitiseInput(req.query[UrlParams.DocumentType] as string) || ''

  const getKeywordLocationFromQuery = () => {
    if (req.query[UrlParams.SearchInAll] === 'true') return KeywordLocation.All
    if (req.query[UrlParams.SearchInTitle] === 'true')
      return KeywordLocation.Title
    if (req.query[UrlParams.SearchInText] === 'true')
      return KeywordLocation.BodyContent
    if (req.query[UrlParams.SearchInDescription] === 'true')
      return KeywordLocation.Description
    return KeywordLocation.All
  }
  const keywordLocation = getKeywordLocationFromQuery()

  const publishingApplication = <PublishingApplication>(
    (sanitiseInput(req.query[UrlParams.PublishingApplication] as string) ||
      PublishingApplication.Any)
  )
  const linkSearchUrl =
    sanitiseInput(req.query[UrlParams.LinkSearchUrl] as string) || ''

  const publishingStatus = sanitiseInput(
    req.query[UrlParams.PublishingStatus] as string
  ) as PublishingStatus

  return {
    searchType,
    selectedWords,
    excludedWords,
    selectedTaxon,
    selectedPublishingOrganisation,
    selectedLocale,
    selectedDocumentType,
    caseSensitive,
    combinator,
    keywordLocation,
    publishingApplication,
    linkSearchUrl,
    publishingStatus,
  }
}

export default getParams
