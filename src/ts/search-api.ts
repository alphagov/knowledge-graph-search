import {
  SearchParams,
  SearchType,
  SearchArea,
  Combinator,
  SearchResults,
} from './search-api-types'
import { languageCode } from './lang'
import { EventType, SearchApiCallback } from './event-types'

const makeQueryString = function (sp: SearchParams): string {
  const usp = new URLSearchParams()
  if (sp.searchType !== SearchType.Keyword)
    usp.set('search-type', sp.searchType)
  if (sp.selectedWords !== '') usp.set('selected-words', sp.selectedWords)
  if (sp.excludedWords !== '') usp.set('excluded-words', sp.excludedWords)
  if (sp.selectedTaxon !== '') usp.set('selected-taxon', sp.selectedTaxon)
  if (sp.selectedOrganisation !== '')
    usp.set('selected-organisation', sp.selectedOrganisation)
  if (sp.selectedLocale !== '') usp.set('lang', languageCode(sp.selectedLocale))
  if (sp.caseSensitive) usp.set('case-sensitive', sp.caseSensitive.toString())
  if (!sp.whereToSearch.title) usp.set('search-in-title', 'false')
  if (!sp.whereToSearch.text) usp.set('search-in-text', 'false')
  if (sp.areaToSearch !== SearchArea.Any) usp.set('area', sp.areaToSearch)
  if (sp.combinator !== Combinator.All) usp.set('combinator', sp.combinator)
  if (sp.linkSearchUrl !== '') usp.set('link-search-url', sp.linkSearchUrl)
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
  const url = `/search?${makeQueryString(searchParams)}`
  let apiResults: SearchResults
  try {
    apiResults = await fetchWithTimeout(url, 300)
  } catch (error: any) {
    console.log('error running main+meta queries', error)
    // TODO: find another way than using a callback function to get rid of the eslint error
    // eslint-disable-next-line n/no-callback-literal
    callback({ type: EventType.SearchApiCallbackFail, error })
    return
  }
  let { main, meta } = apiResults

  // If there's an exact match within the meta results, just keep that one
  const searchKeywords: string = searchParams.selectedWords.replace(/"/g, '')
  const exactMetaResults = meta.filter((result: any) => {
    return result.name.toLowerCase() === searchKeywords.toLowerCase()
  })
  if (exactMetaResults.length === 1) {
    meta = exactMetaResults
  }
  if (meta.length === 1) {
    // one meta result: show the knowledge panel (may require more API queries)
    const fullMetaResults = await buildMetaboxInfo(meta[0])
    // TODO: find another way than using a callback function to get rid of the eslint error
    // eslint-disable-next-line n/no-callback-literal
    callback({
      type: EventType.SearchApiCallbackOk,
      results: { main, meta: fullMetaResults },
    })
    // } else if (metaResults.length >= 1) {
    //   // multiple meta results: we'll show a disambiguation page
    //   callback({ type: EventType.SearchApiCallbackOk, results: { main, meta: metaResults } });
  } else {
    // no meta results
    // TODO: find another way than using a callback function to get rid of the eslint error
    // eslint-disable-next-line n/no-callback-literal
    callback({
      type: EventType.SearchApiCallbackOk,
      results: { main, meta: null },
    })
  }
}

//= ========== private ===========

const buildMetaboxInfo = async function (info: any) {
  console.log(`Found a ${info.type}. Running extra queries`)
  console.log(info)
  switch (info.type) {
    case 'BankHoliday': {
      return await fetchWithTimeout(
        `/bank-holiday?name=${encodeURIComponent(info.name)}`
      )
    }
    case 'Person': {
      return await fetchWithTimeout(
        `/person?name=${encodeURIComponent(info.name)}`
      )
    }
    case 'Role': {
      return await fetchWithTimeout(
        `/role?name=${encodeURIComponent(info.name)}`
      )
    }
    case 'Organisation': {
      return await fetchWithTimeout(
        `/organisation?name=${encodeURIComponent(info.name)}`
      )
    }
    case 'Transaction': {
      return await fetchWithTimeout(
        `/transaction?name=${encodeURIComponent(info.name)}`
      )
    }
    case 'Taxon': {
      return await fetchWithTimeout(
        `/taxon?name=${encodeURIComponent(info.name)}`
      )
    }
    default:
      console.log('unknown meta node type', info.type)
  }
}

export { makeQueryString, fetchWithTimeout, queryBackend }
