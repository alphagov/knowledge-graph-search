import { defaultAllLanguagesOption, languageName } from '../common/utils/lang'
import {
  SearchType,
  SearchParams,
  Combinator,
  PoliticalStatus,
  KeywordLocation,
  UrlParams,
  PublishingStatus,
} from '../common/types/search-api-types'
import { SortAction, State } from './types/state-types'
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

export enum CSVDownloadType {
  CURRENT = 'current',
  ALL = 'all',
}

export const initialSearchParams: SearchParams = {
  searchType: SearchType.Keyword,
  selectedWords: '',
  excludedWords: '',
  taxon: '',
  publishingOrganisation: '',
  language: defaultAllLanguagesOption,
  documentType: '',
  linkSearchUrl: '',
  phoneNumber: '',
  keywordLocation: KeywordLocation.All,
  combinator: Combinator.All,
  publishingApp: '',
  caseSensitive: false, // whether the keyword search is case sensitive
  publishingStatus: PublishingStatus.All,
  politicalStatus: PoliticalStatus.Any,
  government: '',
  linksExactMatch: false,
  associatedPerson: '',
}

const defaultShowFields = {
  page_views: true,
  url: true,
  title: true,
  primary_organisation: true,
  documentType: true,
}

const defaultSortingState = {
  page_views: SortAction.DESC,
}

let state: State
const setState = (newState: State) => {
  state = newState
}
const initState = () => {
  const cachedLayout = loadLayoutStateFromCache()
  const cachedPagination = loadPaginationStateFromCache()
  const showFields = loadShowFieldsStateFromCache() || defaultShowFields
  let newState: State = {
    searchParams: JSON.parse(JSON.stringify(initialSearchParams)), // deep copy
    taxons: [], // list of names of all the taxons
    locales: [], // all the languages found in the content store
    organisations: [], // list of names of all the organisations
    systemErrorText: null,
    documentTypes: [],
    governments: [],
    userErrors: [], // error codes due to user not entering valid search criteria
    searchResults: null,
    skip: 0, // where to start the pagination (number of results)
    pagination: {
      resultsPerPage: config.pagination.defaultResultsPerPage, // number of results per page
      currentPage: 1, // current page number
    },
    stagedShowFields: showFields,
    showFields, // what result columns to show
    waiting: false, // whether we're waiting for a request to return,
    showFiltersPane: true,
    showFieldSet: true,
    sorting: defaultSortingState,
    CSVDownloadType: CSVDownloadType.ALL,
    phoneNumberError: false,
    publishingApps: [], // all the publishing apps listed in the search.publishing_app table
    persons: [], // all the persons listed in the search.people table
  }
  if (cachedLayout) {
    const { showFiltersPane, showFieldSet } = loadLayoutStateFromCache()
    newState = {
      ...newState,
      showFiltersPane,
      showFieldSet,
    }
  }
  if (cachedPagination) {
    newState = {
      ...newState,
      pagination: cachedPagination,
    }
  }

  setState(newState)
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
  state.searchParams.phoneNumber = getURLParamOrFallback(
    'phoneNumber',
    UrlParams.PhoneNumber
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
  state.searchParams.linksExactMatch = getURLParamOrFallback(
    'linksExactMatch',
    UrlParams.LinksExactMatch
  )
  state.searchParams.publishingApp = getURLParamOrFallback(
    'publishingApp',
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

  state.searchParams.politicalStatus = getURLParamOrFallback(
    'politicalStatus',
    UrlParams.PoliticalStatus
  )

  state.searchParams.government = getURLParamOrFallback(
    'government',
    UrlParams.Government
  )
}

const searchStateIsUnset = function (): boolean {
  return (
    state.searchParams.selectedWords === '' &&
    state.searchParams.excludedWords === '' &&
    (state.searchParams.language === '' ||
      state.searchParams.language === defaultAllLanguagesOption) &&
    state.searchParams.taxon === '' &&
    state.searchParams.publishingOrganisation === '' &&
    state.searchParams.linkSearchUrl === '' &&
    state.searchParams.phoneNumber === '' &&
    state.searchParams.documentType === '' &&
    state.searchParams.publishingApp === '' &&
    state.searchParams.publishingStatus === PublishingStatus.All &&
    state.searchParams.politicalStatus === PoliticalStatus.Any &&
    state.searchParams.government === '' &&
    state.searchParams.associatedPerson === ''
  )
}

const searchState = function (): { code: string; errors: string[] } {
  // Find out what to display depending on state
  // returns an object with a "code" field
  // "no-results": there was a search but no results were returned
  // "results": there was a search and there are results to display
  // "initial": there weren't any search criteria specified
  // "error": the user didn't specify a valid query. In this case
  //   we add a "errors" field containing an array with values
  // "waiting": there's a query running
  const errors: string[] = []

  if (state.waiting) return { code: 'waiting', errors }

  if (searchStateIsUnset()) {
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
  state.searchParams.phoneNumber = ''
  state.skip = 0 // reset to first page
  state.searchParams.publishingApp = ''
  state.searchResults = null
  state.waiting = false
  state.searchParams.combinator = Combinator.All
  state.searchParams.publishingStatus = PublishingStatus.All
  state.searchParams.documentType = ''
  state.searchParams.politicalStatus = PoliticalStatus.Any
  state.searchParams.government = ''
}

export {
  state,
  initState,
  setState,
  setStateSearchParamsFromURL as setQueryParamsFromQS,
  searchState,
  resetSearchState,
}
