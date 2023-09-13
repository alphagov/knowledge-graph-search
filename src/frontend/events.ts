import {
  state,
  searchState,
  resetSearch,
  setState,
  initialSearchParams,
} from './state'
import { id, getFormInputValue } from '../common/utils/utils'
import { view } from './view/view'
import { queryBackend } from './search-api'
import { EventType, SearchApiCallback } from './types/event-types'
import {
  SearchType,
  PublishingApplication,
  Combinator,
  KeywordLocation,
  UrlParams,
  PublishingStatus,
  SearchParams,
} from '../common/types/search-api-types'
import { defaultAllLanguagesOption, languageCode } from '../common/utils/lang'
import {
  saveLayoutState,
  saveShowFieldsState,
} from './utils/localStorageService'

declare const window: any

const updateStateFromSideFilters = () => {
  state.searchParams.caseSensitive = (<HTMLInputElement>(
    id('side-filters-case-sensitive')
  ))?.checked
  state.searchParams.excludedWords = getFormInputValue(
    'side-filters-excluded-keywords'
  )
  state.searchParams.taxon = getFormInputValue('side-filters-taxon')
  state.searchParams.publishingOrganisation = getFormInputValue(
    'side-filters-publishing-organisation'
  )
  state.searchParams.language = getFormInputValue('side-filters-language')
  state.searchParams.keywordLocation = getFormInputValue(
    'side-filters-keyword-location'
  ) as KeywordLocation

  state.searchParams.publishingStatus = getFormInputValue(
    'side-filters-publishing-status'
  ) as PublishingStatus

  state.searchParams.publishingApplication = getFormInputValue(
    'side-filters-publishing-application'
  ) as PublishingApplication

  const newCombinatorValue = (
    document.querySelector(
      'input[name="side-filters-combinator"]:checked'
    ) as HTMLInputElement
  ).value as Combinator
  state.searchParams.combinator = newCombinatorValue

  state.searchParams.documentType = (
    getFormInputValue('side-filters-document-type').charAt(0).toLowerCase() +
    getFormInputValue('side-filters-document-type').slice(1)
  ).replace(/ /g, '_')
}

const updateStateFromSearchFilters = () => {
  state.searchParams.selectedWords = getFormInputValue('keyword')
  state.searchParams.caseSensitive = (<HTMLInputElement>(
    id('search-filters-case-sensitive')
  ))?.checked
  const newCombinatorValue =
    ((
      document.querySelector(
        'input[name="search-filters-combinator"]:checked'
      ) as HTMLInputElement
    )?.value as Combinator) || Combinator.All
  state.searchParams.combinator = newCombinatorValue
  state.searchParams.linkSearchUrl = getFormInputValue(
    'search-filters-link-search'
  )
  state.searchParams.excludedWords = getFormInputValue(
    'search-filters-excluded-keywords'
  )
  state.searchParams.keywordLocation = getFormInputValue(
    'search-filters-keyword-location'
  ) as KeywordLocation
  state.searchParams.publishingOrganisation = getFormInputValue(
    'search-filters-publishing-organisation'
  )
  state.searchParams.documentType = (
    getFormInputValue('search-filters-document-type').charAt(0).toLowerCase() +
    getFormInputValue('search-filters-document-type').slice(1)
  ).replace(/ /g, '_')
  state.searchParams.publishingApplication = getFormInputValue(
    'search-filters-publishing-application'
  ) as PublishingApplication
  state.searchParams.taxon = getFormInputValue('search-filters-taxon')
  state.searchParams.publishingStatus =
    (getFormInputValue(
      'search-filters-publishing-status'
    ) as PublishingStatus) || PublishingStatus.All
  state.searchParams.language = getFormInputValue('search-filters-language')
}

const resetFilters = () => {
  const newSearchParams: SearchParams = {
    ...state.searchParams,
    combinator: initialSearchParams.combinator,
    excludedWords: initialSearchParams.excludedWords,
    keywordLocation: initialSearchParams.keywordLocation,
    publishingApplication: initialSearchParams.publishingApplication,
    publishingOrganisation: initialSearchParams.publishingOrganisation,
    documentType: initialSearchParams.documentType,
    taxon: initialSearchParams.taxon,
    language: initialSearchParams.language,
    publishingStatus: initialSearchParams.publishingStatus,
  }

  state.searchParams = newSearchParams
}

const handleSearchTabClick = (id: string) => {
  resetSearch()
  const mapping = {
    'search-keyword': SearchType.Keyword,
    'search-links': SearchType.Link,
    'search-taxons': SearchType.Taxon,
    'search-orgs': SearchType.Organisation,
    'search-langs': SearchType.Language,
    'search-adv': SearchType.Advanced,
  }
  state.searchParams.searchType = mapping[id] || SearchType.Keyword
}

const handleEvent: SearchApiCallback = async function (event) {
  let fieldClicked: RegExpMatchArray | null
  console.log('handleEvent:', event.type, event.id || '')
  switch (event.type) {
    case EventType.SearchTabClick:
      handleSearchTabClick(event.id)
      break
    case EventType.Dom:
      switch (event.id) {
        case 'clear-side-filters-link':
          resetFilters()
          state.searchResults = null
          searchButtonClicked()
          break
        case 'side-filters-submit-btn':
          updateStateFromSideFilters()
          state.searchResults = null
          searchButtonClicked()
          break
        case 'toggle-filters-btn':
          setState({ ...state, showFiltersPane: !state.showFiltersPane })
          saveLayoutState({
            showFiltersPane: state.showFiltersPane,
            showFieldSet: state.showFieldSet,
          })
          break
        case 'toggle-header-options-btn':
          setState({ ...state, showFieldSet: !state.showFieldSet })
          saveLayoutState({
            showFiltersPane: state.showFiltersPane,
            showFieldSet: state.showFieldSet,
          })
          break
        case 'search':
          // Tell GTM a search is starting
          window.dataLayer?.push({
            event: 'formSubmission',
            formType: 'Search',
            formPosition: 'Page',
          })

          updateStateFromSearchFilters()
          state.searchResults = null
          searchButtonClicked()
          break
        case 'button-next-page':
          state.skip = state.skip + state.resultsPerPage
          break
        case 'button-prev-page':
          state.skip = Math.max(state.skip - state.resultsPerPage, 0)
          break
        case 'toggleDisamBox':
          state.disamboxExpanded = !state.disamboxExpanded
          break
        case 'clear-all-headers':
          state.showFields = {}
          saveShowFieldsState(state.showFields)
          break
        case 'check-all-headers':
          state.showFields = Object.keys(state.searchResults[0])
            .filter((k: any) => !['hyperlinks'].includes(k))
            .reduce((a, v) => ({ ...a, [v]: true }), {})
          if (
            (getFormInputValue(
              'side-filters-publishing-status'
            ) as PublishingStatus) === PublishingStatus.NotWithdrawn
          ) {
            state.showFields.withdrawn_at = false
            state.showFields.withdrawn_explanation = false
          }
          saveShowFieldsState(state.showFields)
          break
        default:
          fieldClicked = event.id ? event.id.match(/show-field-(.*)/) : null
          if (fieldClicked && event.id) {
            state.showFields[fieldClicked[1]] = (<HTMLInputElement>(
              id(event.id)
            ))?.checked
            saveShowFieldsState(state.showFields)
          } else {
            console.log('unknown DOM event received:', event)
          }
      }
      break

    // non-dom events
    case EventType.SearchRunning:
      state.waiting = true
      break
    case EventType.SearchApiCallbackOk:
      state.searchResults = event.results?.main.sort(
        (a: any, b: any) => b.page_views - a.page_views
      )
      state.metaSearchResults = event.results?.meta
      state.waiting = false
      state.systemErrorText = null
      break
    case EventType.SearchApiCallbackFail:
      state.searchResults = null
      state.waiting = false
      state.systemErrorText = event.error
      console.log('search-api-callback-fail:', event.error)
      break
    default:
      console.log('unknown event type:', event)
  }
  updateUrl()
  view()

  // scroll to the top of the page when paginating
  if (event.id === 'button-next-page' || event.id === 'button-prev-page') {
    window.scrollTo(0, 0)
  }
}

const searchButtonClicked = async function (): Promise<void> {
  // update the state when the user clicked Search
  window.scrollTo(0, 0)
  state.systemErrorText = null
  state.userErrors = []
  const searchStatus = searchState()
  switch (searchStatus.code) {
    case 'ready-to-search':
      if (
        state.searchParams.selectedWords !== '' ||
        (state.searchParams.language !== '' &&
          state.searchParams.language !== defaultAllLanguagesOption) ||
        state.searchParams.taxon !== '' ||
        state.searchParams.publishingOrganisation !== '' ||
        state.searchParams.linkSearchUrl !== '' ||
        state.searchParams.documentType !== '' ||
        state.searchParams.publishingApplication !==
          PublishingApplication.Any ||
        state.searchParams.publishingStatus !== PublishingStatus.All
      ) {
        state.waiting = true
        queryBackend(state.searchParams, handleEvent)
      }
      break
    case 'error':
      state.userErrors = searchStatus.errors
      break
    case 'waiting':
    case 'initial':
    case 'no-results':
    case 'results':
      break
    default:
      console.log('unknown value for searchState', searchState())
      break
  }
}

const updateUrl = function () {
  if (!('URLSearchParams' in window)) {
    return
  }

  const searchParams = new URLSearchParams()

  const config = {
    selectedWords: {
      condition: (v) => v !== '',
      param: UrlParams.SelectedWords,
    },
    excludedWords: {
      condition: (v) => v !== '',
      param: UrlParams.ExcludedWords,
    },
    caseSensitive: {
      condition: (v) => v,
      param: UrlParams.CaseSensitive,
      transform: (v) => v.toString(),
    },
    publishingOrganisation: {
      condition: (v) => v,
      param: UrlParams.PublishingOrganisation,
    },
    keywordLocation: {
      condition: (v) => v !== KeywordLocation.All,
      param: UrlParams.KeywordLocation,
    },
    documentType: { condition: (v) => v, param: UrlParams.DocumentType },
    taxon: { condition: (v) => v !== '', param: UrlParams.Taxon },
    publishingApplication: {
      condition: (v) => v !== PublishingApplication.Any,
      param: UrlParams.PublishingApplication,
    },
    combinator: {
      condition: (v) => v !== Combinator.All,
      param: UrlParams.Combinator,
    },
    language: {
      condition: (v) => ![defaultAllLanguagesOption, ''].includes(v),
      param: UrlParams.Language,
      transform: (v) => languageCode(v),
    },
    publishingStatus: {
      condition: (v) => v !== PublishingStatus.All,
      param: UrlParams.PublishingStatus,
    },
    linkSearchUrl: {
      condition: (v) => v !== '',
      param: UrlParams.LinkSearchUrl,
    },
    searchType: {
      condition: (v) => v !== SearchType.Keyword,
      param: UrlParams.SearchType,
    },
  }

  const updateSearchParams = (key) => {
    const item = config[key]
    const value = state.searchParams[key]

    if (item.condition(value)) {
      searchParams.set(
        item.param,
        item.transform ? item.transform(value) : value
      )
    }
  }

  const mappings = {
    [SearchType.Keyword]: [
      'selectedWords',
      'caseSensitive',
      'combinator',
      'excludedWords',
      'keywordLocation',
      'publishingOrganisation',
      'documentType',
      'publishingApplication',
      'taxon',
      'publishingStatus',
      'language',
      'searchType',
    ],
    [SearchType.Link]: [
      'linkSearchUrl',
      'publishingOrganisation',
      'publishingApplication',
      'documentType',
      'taxon',
      'publishingStatus',
      'language',
      'searchType',
    ],
    [SearchType.Organisation]: [
      'publishingOrganisation',
      'publishingApplication',
      'searchType',
    ],
    [SearchType.Taxon]: [
      'taxon',
      'publishingOrganisation',
      'publishingStatus',
      'language',
      'documentType',
      'publishingApplication',
      'searchType',
    ],
    [SearchType.Language]: [
      'language',
      'publishingOrganisation',
      'publishingApplication',
      'documentType',
      'taxon',
      'publishingStatus',
      'searchType',
    ],
    [SearchType.Advanced]: [
      'selectedWords',
      'caseSensitive',
      'combinator',
      'excludedWords',
      'linkSearchUrl',
      'keywordLocation',
      'publishingOrganisation',
      'documentType',
      'publishingApplication',
      'taxon',
      'publishingStatus',
      'language',
      'searchType',
    ],
  }

  mappings[state.searchParams.searchType].forEach(updateSearchParams)

  const newQueryString = searchParams.toString()
  const oldQueryString = location.search.slice(1)

  if (newQueryString !== oldQueryString) {
    let newRelativePathQuery = window.location.pathname
    if (newQueryString.length > 0) {
      newRelativePathQuery += '?' + searchParams.toString()
    }
    history.pushState(null, '', newRelativePathQuery)
  }
}

export { handleEvent, searchButtonClicked }
