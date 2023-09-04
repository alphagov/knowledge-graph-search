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
    sanitiseInput(req.query[UrlParams.Taxon] as string) || ''
  const selectedPublishingOrganisation =
    sanitiseInput(req.query[UrlParams.PublishingOrganisation] as string) || ''
  const selectedLocale =
    sanitiseInput(req.query[UrlParams.Language] as string) || ''
  const caseSensitive = req.query[UrlParams.CaseSensitive] === 'true'
  const combinator = <Combinator>(
    (sanitiseInput(req.query[UrlParams.Combinator] as string) || Combinator.All)
  )
  const selectedDocumentType =
    sanitiseInput(req.query[UrlParams.DocumentType] as string) || ''

  const keywordLocation =
    (sanitiseInput(
      req.query[UrlParams.KeywordLocation] as string
    ) as KeywordLocation) || KeywordLocation.All

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
    taxon: selectedTaxon,
    publishingOrganisation: selectedPublishingOrganisation,
    language: selectedLocale,
    documentType: selectedDocumentType,
    caseSensitive,
    combinator,
    keywordLocation,
    publishingApplication,
    linkSearchUrl,
    publishingStatus,
  }
}

export default getParams
