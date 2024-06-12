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

export const getParams = (req: express.Request): SearchParams => {
  const searchType = <SearchType>(
    ((req.query[UrlParams.SearchType] as string) ||
      SearchType.Keyword)
  )
  const selectedWords =
    (req.query[UrlParams.SelectedWords] as string) || ''
  const excludedWords =
    (req.query[UrlParams.ExcludedWords] as string) || ''
  const taxon = (req.query[UrlParams.Taxon] as string) || ''
  const publishingOrganisation =
    (req.query[UrlParams.PublishingOrganisation] as string) || ''
  const language = (req.query[UrlParams.Language] as string) || ''
  const caseSensitive = req.query[UrlParams.CaseSensitive] === 'true'
  const combinator = <Combinator>(
    ((req.query[UrlParams.Combinator] as string) || Combinator.All)
  )
  const documentType =
    (req.query[UrlParams.DocumentType] as string) || ''

  const keywordLocation =
    ((
      req.query[UrlParams.KeywordLocation] as string
    ) as KeywordLocation) || KeywordLocation.All

  const publishingApplication = <PublishingApplication>(
    ((req.query[UrlParams.PublishingApplication] as string) ||
      PublishingApplication.Any)
  )
  const linkSearchUrl =
    (req.query[UrlParams.LinkSearchUrl] as string) || ''
  const phoneNumber =
    (req.query[UrlParams.PhoneNumber] as string) || ''

  const publishingStatus = (
    req.query[UrlParams.PublishingStatus] as string
  ) as PublishingStatus
  const politicalStatus = <PoliticalStatus>(
    ((req.query[UrlParams.PoliticalStatus] as string) ||
      PoliticalStatus.Any)
  )
  const government =
    (req.query[UrlParams.Government] as string) || ''

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
