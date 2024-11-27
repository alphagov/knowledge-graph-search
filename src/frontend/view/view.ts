import { queryDescription } from '../utils/queryDescription'
import { id, splitKeywords } from '../../common/utils/utils'
import { state, searchState, CSVDownloadType } from '../state'
import { handleEvent } from '../events'
import { viewAdvancedSearchPanel, viewSearchPanel } from './view-search-panel'
import { EventType } from '../types/event-types'
import { USER_ERRORS } from '../enums/constants'
import { dispatchCustomGAEvent, fieldName } from './utils'
import { createAgGrid } from './view-grid'
import { viewSideFilters } from './view-side-filters'
import govukPostInitScripts from './postInitScripts'
import {
  Combinator,
  SearchType,
  UrlParams,
} from '../../common/types/search-api-types'

declare const window: any

const errorTitle = 'Sorry, there is a problem with the service'
const serviceName = 'Gov Search'

const view = () => {
  document.title = state.systemErrorText
    ? `${errorTitle}: ${serviceName}`
    : serviceName
  const pageContent: HTMLElement | null = id('page-content')
  if (pageContent) {
    state.systemErrorText
      ? (pageContent.innerHTML = `${viewDataBaseError()}`)
      : (pageContent.innerHTML = `
      <div class="govuk-main-wrapper govuk-!-padding-top-0" id="main-content">
        ${viewErrorBanner()}
        <div class="govuk-tabs" data-module="govuk-tabs" id="govuk-tabs">
          ${viewSearchTypeSelector()}
          ${viewMainLayout()}
        </div>
        <div class="govuk-inset-text">
          Searches do not include GitHub smart answers or service domains.
          Page views depend on cookie consent. Data can be up to 24 hours delayed.
        </div>
      </div>`)
  }

  createAgGrid()

  // Add event handlers
  document
    .querySelectorAll(
      'button, input[type=checkbox][data-interactive=true], a#clear-side-filters-link, #clear-all-headers, #check-all-headers'
    )
    .forEach((input) =>
      input.addEventListener('click', (event) =>
        handleEvent({
          type: EventType.Dom,
          id: (event.target as HTMLElement).getAttribute('id') || undefined,
        })
      )
    )

  document.querySelectorAll('a.govuk-tabs__tab').forEach((tabAnchor) => {
    tabAnchor.addEventListener('click', (event) => {
      handleEvent({
        type: EventType.SearchTabClick,
        id: (event.target as HTMLElement).getAttribute('id') || undefined,
      })
    })
  })

  // Not sure this is even fired, since browser blocks submit because "the form is not connected"
  id('search-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    // Tell GTM the form was submitted
    window.dataLayer = window.dataLayer || []
    dispatchCustomGAEvent('formSubmission', {
      formType: 'Search',
      formPosition: 'Page',
      userOrganisation: state.signonProfileData?.user?.organisation_slug || '',
    })
    handleEvent({ type: EventType.Dom, id: 'search' })
  })

  id('csv-download-select')?.addEventListener('change', (e) => {
    const downloadType = (e.target as HTMLSelectElement)
      .value as CSVDownloadType
    handleEvent({
      type: EventType.Dom,
      id: `download-type-${downloadType}`,
    })
  })

  id('csv-download-btn')?.addEventListener('click', (e) => {
    e.preventDefault()
    const selectedValue = state.CSVDownloadType

    const eventId =
      selectedValue === CSVDownloadType.ALL
        ? 'download-all-csv'
        : 'download-current-csv'
    dispatchCustomGAEvent(eventId, {})
    handleEvent({ type: EventType.Dom, id: eventId })
  })

  govukPostInitScripts()
}

const isTabSelected = (tab: SearchType) =>
  state.searchParams.searchType === tab ? 'true' : 'false'
const isTabClassSelected = (tab: SearchType) =>
  state.searchParams.searchType === tab ? 'govuk-tabs__list-item--selected' : ''

const tabs = [
  {
    id: 'search-keywords',
    label: 'Keywords',
    searchType: SearchType.Keyword,
  },
  {
    id: 'search-links',
    label: 'Links',
    searchType: SearchType.Link,
  },
  {
    id: 'search-phone-numbers',
    label: 'Phone numbers',
    searchType: SearchType.PhoneNumber,
  },
  {
    id: 'search-orgs',
    label: 'Organisations',
    searchType: SearchType.Organisation,
  },
  {
    id: 'search-taxons',
    label: 'Topic tags',
    searchType: SearchType.Taxon,
  },
  {
    id: 'search-langs',
    label: 'Languages',
    searchType: SearchType.Language,
  },
  { id: 'search-persons', label: 'Persons', searchType: SearchType.Person },
  {
    id: 'search-adv',
    label: 'Advanced',
    searchType: SearchType.Advanced,
  },
]

const viewSearchTypeSelector = () => `
  <span class="govuk-tabs__title">Search for</span>
  <ul class="govuk-tabs__list" role="tablist">
    ${tabs
      .map(
        (tab) =>
          `<li role="presentation" class="govuk-tabs__list-item ${isTabClassSelected(
            tab.searchType
          )}">
          <a class="govuk-tabs__tab"
            href="#${tab.id}"
            id="${tab.id}"
            role="tab"
            aria-controls="tab-${tab.id}"
            aria-selected="${isTabSelected(tab.searchType)}">
            ${tab.label}
          </a>
        </li>`
      )
      .join('')}
  </ul>`

const viewMainLayout = () => {
  const result = []
  const tabpanel = tabs.find(
    (tab) => tab.searchType === state.searchParams.searchType
  ).id

  result.push(
    `<div class="govuk-tabs__panel govuk-!-padding-top-4" id="tab-${tabpanel}" role="tabpanel" aria-labelledby="${tabpanel}">`
  )

  if (state.searchParams.searchType === 'advanced') {
    if (!state.searchResults) {
      result.push(`
        <div class="govuk-grid-row advanced-layout--no-results">
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchPanel()}
          </div>
        </div>
      `)
    } else {
      result.push(viewSearchResults())
    }
  } else {
    if (state.searchResults) {
      result.push(viewSearchResults())
    } else {
      result.push(`
      <div class="govuk-grid-row simple-search">
        <div class="govuk-grid-column-two-thirds">
          ${viewSearchPanel()}
        </div>
      </div>
      ${viewSearchResults()}
    `)
    }
  }
  result.push(`</div>`)
  return result.join('')
}

const viewDataBaseError = () => {
  const html = []
  let errorText = ''
  switch (state.systemErrorText.message) {
    case 'BAD_REQUEST':
      errorText =
        "The search could not be performed. This is usually because a phone number couldn't be parsed."
      break
    case 'TIMEOUT':
      errorText =
        'The database took too long to respond. This is usually due to too many query results. Please try a more precise query.'
      break
    default:
      errorText = 'A problem has occurred with the database.'
  }
  html.push(`
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <h1 class="govuk-heading-xl">${errorTitle}</h1>
        <p class="govuk-body">${errorText}</p>
        <p class="govuk-body">Please <a class="govuk-link" href="mailto:data-products-research@digital.cabinet-office.gov.uk">contact the Data Products team</a> if the problem persists.</p>
      </div>
    </div>`)
  return html.join('')
}

const viewErrorBanner = () => {
  const html = []

  if (state.userErrors.length > 0) {
    html.push(`<div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">
            <h1 class="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h1>
            <ul class="govuk-error-summary__list">
          `)
    state.userErrors.forEach((userError) => {
      switch (userError) {
        case USER_ERRORS.MISSING_AREA:
          html.push(`
              <li><a href="#search-scope-wrapper">You need to select a publishing application</a></li>`)
          break
        default:
          console.log('Unknown user error code:', userError)
      }
    })
    html.push(`</ul></div>`)
  }
  return html.join('')
}

const viewSearchResultsTable = () => {
  const html = []
  if (!state.searchResults || state.searchResults?.length <= 0) {
    return ''
  }
  const viewFieldSet = () => {
    const excludeList = ['hyperlinks']

    return `
    <div class="govuk-form-group header-options-container" ${
      state.waiting && 'disabled="disabled"'
    }>
    <fieldset class="govuk-fieldset">
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
        <h2 class="govuk-fieldset__heading">
          Customise table headers
        </h1>
      </legend>
      <p class="govuk-body">
        <a class="govuk-link" id="clear-all-headers" href="javascript:void(0)">Clear all headers</a>
        <a class="govuk-link" id="check-all-headers" href="javascript:void(0)">Select all headers</a>
       </p>
      <div class="header-options-checkboxes-container govuk-checkboxes govuk-checkboxes--small checkbox-list">
      ${Object.keys(state.searchResults[0])
        .map((key) =>
          !excludeList.includes(key)
            ? `
            <div class="govuk-checkboxes__item">
              <input class="govuk-checkboxes__input"
                      data-interactive="true"
                      type="checkbox" id="show-field-${key}"
                ${state.stagedShowFields[key] ? 'checked' : ''}/>
              <label for="show-field-${key}" class="govuk-label govuk-checkboxes__label">${fieldName(
                key
              )}</label>
            </div>`
            : ''
        )
        .join('')}
      </div>
      <button class="govuk-button govuk-button--secondary" id="submit-all-headers">Submit</button>
    </fieldset>
  </div>
  `
  }
  html.push(`<div class="govuk-body search-results-table-container">
  ${state.showFieldSet ? viewFieldSet() : ''}
  <div id="grid-wrapper">
    <div id="results-grid-container" class="ag-theme-alpine"></div>
  </div>
  <div id="pagination-container"></div>
  </div>`)
  return html.join('')
}

const viewWaiting = () => `
  <div aria-live="polite" role="region" role="status" aria-live="assertive">
    <h1 class="govuk-body">${queryDescription({
      searchParams: state.searchParams,
      waiting: true,
    })}</h1>
    <p class="govuk-body-s">Some queries may take up to a minute</p>
  </div>
`

const viewCSVDownload = () => {
  return `<div class="govuk-form-group csv-select-container">
<label class="govuk-label govuk-visually-hidden" for="csv-download-select">
    Download data
  </label>
    <select class="govuk-select" id="csv-download-select" name="csv-download-select" style="width: 100%;">
      <option value="${CSVDownloadType.CURRENT}" ${
    state.CSVDownloadType === CSVDownloadType.CURRENT ? 'selected' : ''
  }>Current results (${state.pagination.resultsPerPage})</option>
      <option value="${CSVDownloadType.ALL}" ${
    state.CSVDownloadType === CSVDownloadType.ALL ? 'selected' : ''
  }>All results (${state.searchResults?.length})</option>
    </select>
    <button class="govuk-button govuk-button--secondary" id="csv-download-btn">Download CSV</button>
  </div>`
}

const viewResults = function () {
  if (state.searchResults) {
    const html = []
    const nbRecords = state.searchResults.length

    html.push(`<div class="before-results-container">`)
    html.push(`<div class="results-comments">`)
    if (nbRecords < 10000) {
      html.push(
        `<h1 class="govuk-body" role="status" aria-live="assertive">${queryDescription(
          {
            searchParams: state.searchParams,
            nbRecords,
          }
        )}</h1>`
      )
    } else {
      html.push(`
        <h1 class="govuk-warning-text" role="status" aria-live="assertive">
          <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
          <strong class="govuk-warning-text__text">
            <span class="govuk-warning-text__assistive">Warning</span>
            There are more than 10000 results. Try to narrow down your search.
          </strong>
        </h1>
      `)
    }

    // .results-comments
    html.push(`</div>`)

    // .before-results-container
    html.push(`</div>`)

    const resultsContainer = `
    <div class="results-container ${
      state.showFiltersPane ? '' : 'hide-filters'
    }">
      <div class='results-container-row-1-headers'>
        <div class="hide-panel-button-container">
          <button id="toggle-filters-btn" class="govuk-button govuk-button--secondary">${
            state.showFiltersPane ? 'Hide Filters' : 'Show Filters'
          }</button>
        </div>
        <div class="hide-panel-button-container">
          <button class="govuk-button govuk-button--secondary" id="toggle-header-options-btn">${
            state.showFieldSet ? 'Hide header options' : 'Show header options'
          }</button>
        </div>
        ${viewCSVDownload()}
      </div>
      <div class="results-container-row-2-results">
        ${
          state.searchParams.searchType === 'advanced'
            ? viewAdvancedSearchPanel(true)
            : viewSideFilters()
        }
        ${viewSearchResultsTable()}
      </div>
    </div>`

    html.push(resultsContainer)

    return html.join('')
  } else {
    return ''
  }
}

const viewNoResults = () => {
  const multipleKeywords =
    (splitKeywords(state.searchParams.selectedWords) || []).length > 1
  const isAllKeywordsCombinator =
    state.searchParams.combinator === Combinator.All

  let newUrl: string | null = null
  if (multipleKeywords && isAllKeywordsCombinator) {
    const currentUrl = new URL(window.location.href)
    const newSearchParams = new URLSearchParams(currentUrl.search)
    newSearchParams.set(UrlParams.Combinator, Combinator.Any)
    newUrl = `?${newSearchParams.toString()}`
  }
  return `
    <h1 class="govuk-body govuk-inset-text" role="status" aria-live="assertive">
      <span class="govuk-!-font-weight-bold">No results</span> for ${queryDescription(
        {
          searchParams: state.searchParams,
        }
      )}
      ${
        newUrl
          ? `<p>Try searching for <a href="${newUrl}" class="govuk-link">any of your keywords</a>.</p>`
          : '<p>Try a different keyword or adjust your filters.</p>'
      }
      <button class="govuk-button govuk-button--secondary" id="new-search-btn">New search</button>
    </h1>
  `
}

const viewSearchResults = () => {
  switch (searchState().code) {
    case 'waiting':
      document.title = `GOV.UK ${queryDescription({
        searchParams: state.searchParams,
        includeMarkup: false,
      })} - ${serviceName}`
      return viewWaiting()
    case 'results':
      document.title = `GOV.UK ${queryDescription({
        searchParams: state.searchParams,
        includeMarkup: false,
      })} - ${serviceName}`
      if (window.ga)
        window.ga('send', 'search', {
          search: document.title,
          resultsFound: true,
        })
      return viewResults()
    case 'no-results':
      document.title = `GOV.UK ${queryDescription({
        searchParams: state.searchParams,
        includeMarkup: false,
      })} - ${serviceName}`
      if (window.ga)
        window.ga('send', 'search', {
          search: document.title,
          resultsFound: false,
        })
      return viewNoResults()
    default:
      document.title = serviceName
      return ''
  }
}

export { view }
