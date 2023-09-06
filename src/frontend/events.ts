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
  const newCombinatorValue = (
    document.querySelector(
      'input[name="search-filters-combinator"]:checked'
    ) as HTMLInputElement
  ).value as Combinator
  state.searchParams.combinator = newCombinatorValue
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
  state.searchParams.publishingStatus = getFormInputValue(
    'search-filters-publishing-status'
  ) as PublishingStatus
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
    'tab_search-keyword': SearchType.Keyword,
    'tab_search-links': SearchType.Link,
    'tab_search-taxons': SearchType.Taxon,
    'tab_search-orgs': SearchType.Organisation,
    'tab_search-langs': SearchType.Language,
    'tab_search-adv': SearchType.Advanced,
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
          break
        case 'toggle-header-options-btn':
          setState({ ...state, showFieldSet: !state.showFieldSet })
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
        default:
          fieldClicked = event.id ? event.id.match(/show-field-(.*)/) : null
          if (fieldClicked && event.id) {
            state.showFields[fieldClicked[1]] = (<HTMLInputElement>(
              id(event.id)
            ))?.checked
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
        console.log('QUERY BACKEND')
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
  if ('URLSearchParams' in window) {
    const searchParams = new URLSearchParams()
    switch (state.searchParams.searchType) {
      case SearchType.Keyword:
        if (state.searchParams.selectedWords !== '') {
          searchParams.set(
            UrlParams.SelectedWords,
            state.searchParams.selectedWords
          )
        }
        if (state.searchParams.excludedWords !== '') {
          searchParams.set(
            UrlParams.ExcludedWords,
            state.searchParams.excludedWords
          )
        }
        if (state.searchParams.caseSensitive) {
          searchParams.set(
            UrlParams.CaseSensitive,
            state.searchParams.caseSensitive.toString()
          )
        }
        if (state.searchParams.publishingOrganisation) {
          searchParams.set(
            UrlParams.PublishingOrganisation,
            state.searchParams.publishingOrganisation
          )
        }
        if (state.searchParams.keywordLocation !== KeywordLocation.All) {
          searchParams.set(
            UrlParams.KeywordLocation,
            state.searchParams.keywordLocation
          )
        }
        if (state.searchParams.documentType) {
          searchParams.set(
            UrlParams.DocumentType,
            state.searchParams.documentType
          )
        }
        if (state.searchParams.taxon !== '') {
          searchParams.set(UrlParams.Taxon, state.searchParams.taxon)
        }
        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }
        if (state.searchParams.combinator !== Combinator.All) {
          searchParams.set(UrlParams.Combinator, state.searchParams.combinator)
        }

        if (
          ![defaultAllLanguagesOption, ''].includes(state.searchParams.language)
        ) {
          searchParams.set(
            UrlParams.Language,
            languageCode(state.searchParams.language)
          )
        }
        if (state.searchParams.publishingStatus !== PublishingStatus.All) {
          searchParams.set(
            UrlParams.PublishingStatus,
            state.searchParams.publishingStatus
          )
        }
        break
      case SearchType.Link:
        searchParams.set(UrlParams.SearchType, state.searchParams.searchType)
        if (state.searchParams.linkSearchUrl !== '') {
          searchParams.set(
            UrlParams.LinkSearchUrl,
            state.searchParams.linkSearchUrl
          )
        }
        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }
        break
      case SearchType.Taxon:
        searchParams.set(UrlParams.SearchType, state.searchParams.searchType)
        if (state.searchParams.taxon !== '') {
          searchParams.set(UrlParams.Taxon, state.searchParams.taxon)
        }
        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }
        break
      case SearchType.Organisation:
        searchParams.set(UrlParams.SearchType, state.searchParams.searchType)
        if (state.searchParams.publishingOrganisation) {
          searchParams.set(
            UrlParams.PublishingOrganisation,
            state.searchParams.publishingOrganisation
          )
        }
        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }
        break
      case SearchType.Language:
        searchParams.set(UrlParams.SearchType, state.searchParams.searchType)
        if (state.searchParams.language !== defaultAllLanguagesOption) {
          searchParams.set(
            UrlParams.Language,
            languageCode(state.searchParams.language)
          )
        }
        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }
        break
      default:
        searchParams.set(UrlParams.SearchType, state.searchParams.searchType)
        if (state.searchParams.selectedWords !== '') {
          searchParams.set(
            UrlParams.SelectedWords,
            state.searchParams.selectedWords
          )
        }
        if (state.searchParams.excludedWords !== '') {
          searchParams.set(
            UrlParams.ExcludedWords,
            state.searchParams.excludedWords
          )
        }
        if (state.searchParams.taxon !== '') {
          searchParams.set(UrlParams.Taxon, state.searchParams.taxon)
        }
        if (state.searchParams.publishingOrganisation) {
          searchParams.set(
            UrlParams.PublishingOrganisation,
            state.searchParams.publishingOrganisation
          )
        }
        if (state.searchParams.documentType) {
          searchParams.set(
            UrlParams.DocumentType,
            state.searchParams.documentType
          )
        }
        if (state.searchParams.language !== defaultAllLanguagesOption) {
          searchParams.set(
            UrlParams.Language,
            languageCode(state.searchParams.language)
          )
        }
        if (state.searchParams.caseSensitive) {
          searchParams.set(
            UrlParams.CaseSensitive,
            state.searchParams.caseSensitive.toString()
          )
        }
        if (state.searchParams.publishingStatus !== PublishingStatus.All) {
          searchParams.set(
            UrlParams.PublishingStatus,
            state.searchParams.publishingStatus
          )
        }
        if (state.searchParams.keywordLocation !== KeywordLocation.All) {
          searchParams.set(
            UrlParams.KeywordLocation,
            state.searchParams.keywordLocation
          )
        }

        if (
          state.searchParams.publishingApplication !== PublishingApplication.Any
        ) {
          searchParams.set(
            UrlParams.PublishingApplication,
            state.searchParams.publishingApplication
          )
        }

        if (state.searchParams.combinator !== Combinator.All) {
          searchParams.set(UrlParams.Combinator, state.searchParams.combinator)
        }

        if (state.searchParams.linkSearchUrl !== '') {
          searchParams.set(
            UrlParams.LinkSearchUrl,
            state.searchParams.linkSearchUrl
          )
        }
        break
    }
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
}

export { handleEvent, searchButtonClicked }
