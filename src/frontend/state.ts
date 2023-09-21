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
import {
  loadLayoutStateFromCache,
  loadPaginationStateFromCache,
  loadShowFieldsStateFromCache,
} from './utils/localStorageService'

// user inputs that are used to build the query.
// (basically, everything whose value could be found in the URL)
// Separate from (but included in)  state to make
// it easier to reset to those initial
// values only while keeping the rest of the state

export const initialSearchParams: SearchParams = {
  searchType: SearchType.Keyword,
  selectedWords: '',
  excludedWords: '',
  taxon: '',
  publishingOrganisation: '',
  language: defaultAllLanguagesOption,
  documentType: '',
  linkSearchUrl: '',
  keywordLocation: KeywordLocation.All,
  combinator: Combinator.All,
  publishingApplication: PublishingApplication.Any,
  caseSensitive: false, // whether the keyword search is case sensitive
  publishingStatus: PublishingStatus.All,
}

const defaultShowFields = {
  page_views: true,
  url: true,
  title: true,
  primary_organisation: true,
  documentType: true,
}

const cachedLayout = loadLayoutStateFromCache()
const cachedPagination = loadPaginationStateFromCache()
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
  pagination: {
    resultsPerPage: config.pagination.defaultResultsPerPage, // number of results per page
    currentPage: 1, // current page number
  },
  showFields: loadShowFieldsStateFromCache() || defaultShowFields, // what result columns to show
  waiting: false, // whether we're waiting for a request to return,
  disamboxExpanded: false, // if there's a resizeable disamb meta box, whether it's expanded or not
  showFiltersPane: true,
  showFieldSet: true,
}
if (cachedLayout) {
  const { showFiltersPane, showFieldSet } = loadLayoutStateFromCache()
  state = {
    ...state,
    showFiltersPane,
    showFieldSet,
  }
}
if (cachedPagination) {
  state = {
    ...state,
    pagination: cachedPagination,
  }
}

const setState = (newState) => {
  state = newState
}

const setStateSearchParamsFromURL = function (): void {
  const searchParams: URLSearchParams = new URLSearchParams(
    window.location.search
  )
  const getURLParamOrFallback = (
    stateField: keyof SearchParams,
    urlParam: string
  ): any =>
    searchParams.get(urlParam) !== null
      ? searchParams.get(urlParam)
      : initialSearchParams[stateField]

  state.searchParams.searchType = getURLParamOrFallback(
    'searchType',
    UrlParams.SearchType
  )
  state.searchParams.selectedWords = getURLParamOrFallback(
    'selectedWords',
    UrlParams.SelectedWords
  )
  state.searchParams.excludedWords = getURLParamOrFallback(
    'excludedWords',
    UrlParams.ExcludedWords
  )
  state.searchParams.linkSearchUrl = getURLParamOrFallback(
    'linkSearchUrl',
    UrlParams.LinkSearchUrl
  )
  state.searchParams.taxon = getURLParamOrFallback('taxon', UrlParams.Taxon)
  state.searchParams.publishingOrganisation = getURLParamOrFallback(
    'publishingOrganisation',
    UrlParams.PublishingOrganisation
  )

  const lang: string | null = searchParams.get(UrlParams.Language)
  state.searchParams.language =
    lang && lang !== defaultAllLanguagesOption
      ? languageName(lang)
      : initialSearchParams.language
  state.searchParams.caseSensitive = getURLParamOrFallback(
    'caseSensitive',
    UrlParams.CaseSensitive
  )
  state.searchParams.publishingApplication = getURLParamOrFallback(
    'publishingApplication',
    UrlParams.PublishingApplication
  )
  state.searchParams.combinator = getURLParamOrFallback(
    'combinator',
    UrlParams.Combinator
  )

  state.searchParams.keywordLocation = getURLParamOrFallback(
    'keywordLocation',
    UrlParams.KeywordLocation
  )

  state.searchParams.documentType = getURLParamOrFallback(
    'documentType',
    UrlParams.DocumentType
  )

  state.searchParams.publishingStatus = getURLParamOrFallback(
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
    state.searchParams.taxon === '' &&
    state.searchParams.publishingOrganisation === '' &&
    state.searchParams.language === '' &&
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

const resetSearchState = function (): void {
  console.log('resetting search')
  state.searchParams.selectedWords = ''
  state.searchParams.excludedWords = ''
  state.searchParams.taxon = ''
  state.searchParams.publishingOrganisation = ''
  state.searchParams.language = defaultAllLanguagesOption
  state.searchParams.keywordLocation = KeywordLocation.All
  state.searchParams.caseSensitive = false
  state.searchParams.linkSearchUrl = ''
  state.skip = 0 // reset to first page
  state.searchParams.publishingApplication = PublishingApplication.Any
  state.searchResults = null
  state.waiting = false
  state.searchParams.combinator = Combinator.All
  state.searchParams.publishingStatus = PublishingStatus.All
  state.searchParams.documentType = ''
}

export {
  state,
  setState,
  setStateSearchParamsFromURL as setQueryParamsFromQS,
  searchState,
  resetSearchState,
}
