import {
  SearchParams,
  SearchType,
  PoliticalStatus,
  Combinator,
  SearchResults,
  UrlParams,
  KeywordLocation,
} from '../common/types/search-api-types'
import { defaultAllLanguagesOption, languageCode } from '../common/utils/lang'
import { EventType, SearchApiCallback } from './types/event-types'

const makeURLfromSearchParams = function (searchParams: SearchParams): string {
  const usp = new URLSearchParams()
  if (searchParams.searchType !== SearchType.Keyword)
    usp.set(UrlParams.SearchType, searchParams.searchType)
  if (searchParams.selectedWords !== '')
    usp.set(UrlParams.SelectedWords, searchParams.selectedWords)
  if (searchParams.excludedWords !== '')
    usp.set(UrlParams.ExcludedWords, searchParams.excludedWords)
  if (searchParams.taxon !== '') usp.set(UrlParams.Taxon, searchParams.taxon)
  if (searchParams.publishingOrganisation !== '')
    usp.set(
      UrlParams.PublishingOrganisation,
      searchParams.publishingOrganisation
    )
  if (searchParams.language !== defaultAllLanguagesOption)
    usp.set(UrlParams.Language, languageCode(searchParams.language))
  if (searchParams.caseSensitive)
    usp.set(UrlParams.CaseSensitive, searchParams.caseSensitive.toString())
  if (searchParams.linksExactMatch)
    usp.set(UrlParams.LinksExactMatch, searchParams.linksExactMatch.toString())
  if (searchParams.keywordLocation !== KeywordLocation.All) {
    usp.set(UrlParams.KeywordLocation, searchParams.keywordLocation)
  }

  if (searchParams.documentType)
    usp.set(UrlParams.DocumentType, searchParams.documentType)

  if (searchParams.publishingApp !== '') {
    usp.set(UrlParams.PublishingApplication, searchParams.publishingApp)
  }
  if (searchParams.combinator !== Combinator.All)
    usp.set(UrlParams.Combinator, searchParams.combinator)
  if (searchParams.linkSearchUrl !== '')
    usp.set(UrlParams.LinkSearchUrl, searchParams.linkSearchUrl)
  if (searchParams.phoneNumber !== '')
    usp.set(UrlParams.PhoneNumber, searchParams.phoneNumber)
  usp.set(UrlParams.PublishingStatus, searchParams.publishingStatus)
  if (searchParams.politicalStatus !== PoliticalStatus.Any) {
    usp.set(UrlParams.PoliticalStatus, searchParams.politicalStatus)
  }
  if (searchParams.government !== '') {
    usp.set(UrlParams.Government, searchParams.government)
  }
  if (searchParams.associatedPerson !== '') {
    usp.set(UrlParams.AssociatedPerson, searchParams.associatedPerson)
  }
  return usp.toString()
}

const fetchWithTimeout = async function (url: string, timeoutSeconds = 60) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  const fetchResult = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
    },
    signal: controller.signal,
  })

  if (fetchResult.status === 400) {
    throw new Error('BAD_REQUEST')
  }

  if (fetchResult.status === 401) {
    // Reload the page to trigger server-side authentication
    location.reload()
  }

  const responseBody = await fetchResult.json()

  if (!fetchResult.ok) {
    if (/^timeout of \d+ms exceeded/.test(responseBody.message)) {
      throw new Error('TIMEOUT')
    } else {
      throw new Error('UNKNOWN')
    }
  } else {
    return responseBody
  }
}

// called from browser
const queryBackend: (
  searchParams: SearchParams,
  callback: SearchApiCallback
) => Promise<void> = async function (searchParams, callback) {
  // TODO: find another way than using a callback function to get rid of the eslint error
  // eslint-disable-next-line n/no-callback-literal
  callback({ type: EventType.SearchRunning })
  searchParams.selectedWords = searchParams.selectedWords.replace(/[“”]/g, '"')
  searchParams.excludedWords = searchParams.excludedWords.replace(/[“”]/g, '"')
  const url = `/search?${makeURLfromSearchParams(searchParams)}`

  let apiResults: SearchResults
  try {
    apiResults = await fetchWithTimeout(url, 300)
  } catch (error: any) {
    console.log('error running queries', error)
    // TODO: find another way than using a callback function to get rid of the eslint error
    // eslint-disable-next-line n/no-callback-literal
    callback({ type: EventType.SearchApiCallbackFail, error })
    return
  }

  // TODO: find another way than using a callback function to get rid of the eslint error
  // eslint-disable-next-line n/no-callback-literal
  callback({
    type: EventType.SearchApiCallbackOk,
    results: apiResults,
  })
}

//= ========== private ===========

export {
  makeURLfromSearchParams as makeQueryString,
  fetchWithTimeout,
  queryBackend,
}
