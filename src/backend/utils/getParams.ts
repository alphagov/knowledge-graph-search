import * as express from 'express'
import {
  SearchParams,
  Combinator,
  PublishingApplication,
  SearchType,
  KeywordLocation,
  UrlParams,
  PublishingStatus,
  PoliticalStatus,
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
  const taxon = sanitiseInput(req.query[UrlParams.Taxon] as string) || ''
  const publishingOrganisation =
    sanitiseInput(req.query[UrlParams.PublishingOrganisation] as string) || ''
  const language = sanitiseInput(req.query[UrlParams.Language] as string) || ''
  const caseSensitive = req.query[UrlParams.CaseSensitive] === 'true'
  const combinator = <Combinator>(
    (sanitiseInput(req.query[UrlParams.Combinator] as string) || Combinator.All)
  )
  const documentType =
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
  const phoneNumber =
    sanitiseInput(req.query[UrlParams.PhoneNumber] as string) || ''

  const publishingStatus = sanitiseInput(
    req.query[UrlParams.PublishingStatus] as string
  ) as PublishingStatus
  const politicalStatus = <PoliticalStatus>(
    (sanitiseInput(req.query[UrlParams.PoliticalStatus] as string) ||
      PoliticalStatus.Any)
  )
  const government =
    sanitiseInput(req.query[UrlParams.Government] as string) || ''

  return {
    searchType,
    selectedWords,
    excludedWords,
    taxon,
    publishingOrganisation,
    language,
    documentType,
    caseSensitive,
    combinator,
    keywordLocation,
    publishingApplication,
    linkSearchUrl,
    phoneNumber,
    publishingStatus,
    politicalStatus,
    government,
  }
}

export default getParams
