import { defaultAllLanguagesOption, languageName } from '../common/utils/lang'
import {
  SearchType,
  SearchParams,
  Combinator,
  PublishingApplication,
  KeywordLocation,
  UrlParams,
  PublishingStatus,
} from '../common/types/search-api-types'
import { State } from './types/state-types'
import config from './config'

// user inputs that are used to build the query.
// (basically, everything whose value could be found in the URL)
// Separate from (but included in)  state to make
// it easier to reset to those initial
// values only while keeping the rest of the state

const initialSearchParams: SearchParams = {
  searchType: SearchType.Keyword,
  selectedWords: '',
  excludedWords: '',
  selectedTaxon: '',
  selectedPublishingOrganisation: '',
  selectedLocale: defaultAllLanguagesOption,
  selectedDocumentType: '',
  linkSearchUrl: '',
  keywordLocation: KeywordLocation.All,
  combinator: Combinator.All,
  publishingApplication: PublishingApplication.Any,
  caseSensitive: false, // whether the keyword search is case sensitive
  publishingStatus: PublishingStatus.All,
}

let state: State = {
  searchParams: JSON.parse(JSON.stringify(initialSearchParams)), // deep copy
  taxons: [], // list of names of all the taxons
  locales: [], // all the languages found in the content store
  organisations: [], // list of names of all the organisations
  systemErrorText: null,
  documentTypes: [],
  userErrors: [], // error codes due to user not entering valid search criteria
  searchResults: null,
  metaSearchResults: null,
  skip: 0, // where to start the pagination (number of results)
  resultsPerPage: config.pagination.defaultResultsPerPage, // number of results per page
  showFields: {
    // what result fields to show by default
    page_views: true,
    url: true,
    title: true,
    primary_organisation: true,
    documentType: true,
  },
  waiting: false, // whether we're waiting for a request to return,
  disamboxExpanded: false, // if there's a resizeable disamb meta box, whether it's expanded or not
  showFiltersPane: true,
  showFieldSet: true,
}

const setState = (newState) => {
  state = newState
}

const setQueryParamsFromQS = function (): void {
  const searchParams: URLSearchParams = new URLSearchParams(
    window.location.search
  )
  const maybeReplace = (stateField: keyof SearchParams, qspName: string): any =>
    searchParams.get(qspName) !== null
      ? searchParams.get(qspName)
      : initialSearchParams[stateField]

  state.searchParams.searchType = maybeReplace(
    'searchType',
    UrlParams.SearchType
  )
  state.searchParams.selectedWords = maybeReplace(
    'selectedWords',
    UrlParams.SelectedWords
  )
  state.searchParams.excludedWords = maybeReplace(
    'excludedWords',
    UrlParams.ExcludedWords
  )
  state.searchParams.linkSearchUrl = maybeReplace(
    'linkSearchUrl',
    UrlParams.LinkSearchUrl
  )
  state.searchParams.selectedTaxon = maybeReplace(
    'selectedTaxon',
    UrlParams.SelectedTaxon
  )
  state.searchParams.selectedPublishingOrganisation = maybeReplace(
    'selectedPublishingOrganisation',
    UrlParams.SelectedPublishingOrganisation
  )

  const lang: string | null = searchParams.get(UrlParams.Language)
  state.searchParams.selectedLocale =
    lang && lang !== defaultAllLanguagesOption
      ? languageName(lang)
      : initialSearchParams.selectedLocale
  state.searchParams.caseSensitive = maybeReplace(
    'caseSensitive',
    UrlParams.CaseSensitive
  )
  state.searchParams.publishingApplication = maybeReplace(
    'publishingApplication',
    UrlParams.PublishingApplication
  )
  state.searchParams.combinator = maybeReplace(
    'combinator',
    UrlParams.Combinator
  )

  state.searchParams.keywordLocation = maybeReplace(
    'keywordLocation',
    UrlParams.KeywordLocation
  )

  state.searchParams.selectedDocumentType = maybeReplace(
    'selectedDocumentType',
    UrlParams.DocumentType
  )

  state.searchParams.publishingStatus = maybeReplace(
    'publishingStatus',
    UrlParams.PublishingStatus
  )
}

const searchState = function (): { code: string; errors: string[] } {
  // Find out what to display depending on state
  // returns an object with a "code" field
  // "no-results": there was a search but no results were returned
  // "results": there was a search and there are results to display
  // "initial": there weren't any search criteria specified
  // "errors": the user didn't specify a valid query. In this case
  //   we add a "errors" field containing an array with values
  // "waiting": there's a query running
  const errors: string[] = []

  if (state.waiting) return { code: 'waiting', errors }

  if (
    state.searchParams.selectedWords === '' &&
    state.searchParams.excludedWords === '' &&
    state.searchParams.selectedTaxon === '' &&
    state.searchParams.selectedPublishingOrganisation === '' &&
    state.searchParams.selectedLocale === '' &&
    state.searchParams.linkSearchUrl === ''
  ) {
    return { code: 'initial', errors }
  }

  if (errors.length > 0) return { code: 'error', errors }
  if (state.searchResults && state.searchResults.length > 0)
    return { code: 'results', errors }
  if (state.searchResults && state.searchResults.length === 0)
    return { code: 'no-results', errors }
  return { code: 'ready-to-search', errors }
}

const resetSearch = function (): void {
  state.searchParams.selectedWords = ''
  state.searchParams.excludedWords = ''
  state.searchParams.selectedTaxon = ''
  state.searchParams.selectedPublishingOrganisation = ''
  state.searchParams.selectedLocale = ''
  state.searchParams.keywordLocation = KeywordLocation.All
  state.searchParams.caseSensitive = false
  state.searchParams.linkSearchUrl = ''
  state.skip = 0 // reset to first page
  state.searchParams.publishingApplication = PublishingApplication.Any
  state.searchResults = null
  state.waiting = false
  state.searchParams.combinator = Combinator.All
}

export { state, setState, setQueryParamsFromQS, searchState, resetSearch }
