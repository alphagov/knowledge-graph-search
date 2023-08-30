import { queryDescription } from '../utils/queryDescription'
import { id } from '../../common/utils/utils'
import { state, searchState } from '../state'
import { handleEvent } from '../events'
import { viewMetaResults } from './view-metabox'
import { viewSearchPanel } from './view-search-panel'
import { EventType } from '../types/event-types'
import { USER_ERRORS } from '../enums/constants'
import { fieldName } from './utils'
import { createAgGrid } from './view-grid'

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
      <div class="govuk-main-wrapper" id="main-content">
      ${viewErrorBanner()}
      ${viewSearchTypeSelector()}
      ${viewMainLayout()}
      <p class="govuk-body-s">
        Searches do not include history mode content, Publisher GitHub smart answers or service domains.
        Page views depend on cookie consent.
      </p>
      </div>`)
  }

  createAgGrid()

  // Add event handlers
  document
    .querySelectorAll(
      'button, a.govuk-tabs__tab, input[type=checkbox][data-interactive=true]'
    )
    .forEach((input) =>
      input.addEventListener('click', (event) =>
        handleEvent({
          type: EventType.Dom,
          id: (event.target as HTMLElement).getAttribute('id') || undefined,
        })
      )
    )

  // Not sure this is even fired, since browser blocks submit because "the form is not connected"
  id('search-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    // Tell GTM the form was submitted
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'formSubmission',
      formType: 'Search',
      formPosition: 'Page',
    })
    handleEvent({ type: EventType.Dom, id: 'search' })
  })

  id('meta-results-expand')?.addEventListener('click', () =>
    handleEvent({ type: EventType.Dom, id: 'toggleDisamBox' })
  )

  // focus on the results heading if present
  id('results-heading')?.focus()
}

const viewSearchTypeSelector = () => `
  <div class="govuk-tabs" data-module="govuk-tabs">
  <span class="govuk-tabs__title">Search for</span>
  <ul class="govuk-tabs__list">
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'keyword'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-keywords" id="search-keyword">
      Keywords
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'link'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-links" id="search-link">
      Links
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'organisation'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-organisation" id="search-organisation">
      Organisations
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'taxon'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-taxon" id="search-taxon">
      Taxons
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'language'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-language" id="search-language">
      Languages
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'advanced'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-advanced" id="search-advanced">
      Advanced
      </a>
    </li>
  </ul>
</div>`

const viewMainLayout = () => {
  const result = []
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
      result.push(`
        <div class="govuk-grid-row advanced-layout">
          <div class="govuk-grid-column-one-third">
            ${viewSearchPanel()}
          </div>
          <div class="govuk-grid-column-two-thirds">
            ${viewSearchResults()}
          </div>
        </div>
      `)
    }
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
  return result.join('')
}

const viewDataBaseError = () => {
  const html = []
  let errorText = ''
  switch (state.systemErrorText) {
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
        case USER_ERRORS.MISSING_WHERE_TO_SEARCH:
          html.push(`
              <li><a href="#search-locations-wrapper">You need to select a keyword location</a></li>`)
          break
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
  html.push(`
    <div class="govuk-body">
      <fieldset class="govuk-fieldset" ${
        state.waiting && 'disabled="disabled"'
      }>
        <legend class="govuk-fieldset__legend">For each result, display:</legend>
        <ul class="kg-checkboxes" id="show-fields">`)
  html.push(
    Object.keys(state.searchResults[0])
      .map(
        (key) => `
          <li class="kg-checkboxes__item">
            <input class="kg-checkboxes__input"
                    data-interactive="true"
                    type="checkbox" id="show-field-${key}"
              ${state.showFields[key] ? 'checked' : ''}/>
            <label for="show-field-${key}" class="kg-label kg-checkboxes__label">${fieldName(
          key
        )}</label>
          </li>`
      )
      .join('')
  )
  html.push(`
        </ul>
      </fieldset>`)
  html.push('<div id="results-grid-container" class="ag-theme-alpine"></div>')
  html.push('<div id="pagination-container"></div>')
  html.push(`
    </div>`)
  return html.join('')
}

const viewFiltersPane = () => {
  return `<div class="filters-pane"></div>`
}

const viewWaiting = () => `
  <div aria-live="polite" role="region">
    <div class="govuk-body">Searching for ${queryDescription(
      state.searchParams
    )}</div>
    <p class="govuk-body-s">Some queries may take up to a minute</p>
  </div>
`

const viewResults = function () {
  if (state.searchResults) {
    const html = []
    const nbRecords = state.searchResults.length

    if (nbRecords < 10000) {
      html.push(`
        <h1 tabindex="0" id="results-heading" class="govuk-heading-l">${nbRecords} result${
        nbRecords !== 0 ? 's' : ''
      }</h1>`)
    } else {
      html.push(`
        <div class="govuk-warning-text">
          <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
          <strong class="govuk-warning-text__text">
            <span class="govuk-warning-text__assistive">Warning</span>
            There are more than 10000 results. Try to narrow down your search.
          </strong>
        </div>
      `)
    }

    html.push(
      `<div class="govuk-body">for ${queryDescription(
        state.searchParams
      )}</div>`
    )

    if (nbRecords > state.resultsPerPage) {
      html.push(`
        <p class="govuk-body">Showing results ${state.skip + 1} to ${Math.min(
        nbRecords,
        state.skip + state.resultsPerPage
      )}, in descending popularity</p>
        <a class="govuk-skip-link" href="#results-table">Skip to results</a>
        <a class="govuk-skip-link" href="#search-form">Back to search filters</a>
     `)
    }

    const resultsContainer = `
    <div class="results-container ${
      state.hideFiltersPane ? 'hide-filters' : ''
    }">
      <div class='results-container-row-1-headers'>
        <div class="hide-filters-button-container">
          <button id="hide-filters-btn" class="govuk-button govuk-button--secondary">${
            state.hideFiltersPane ? 'Show Filters' : 'Hide Filters'
          }</button>
        </div>
        <button class="govuk-button govuk-button--secondary">Select columns</button>
      </div>
      <div class="results-container-row-2-results">
        ${viewFiltersPane()}
        ${viewSearchResultsTable()}
      </div>
    </div>`

    html.push(resultsContainer)

    html.push(`
      <p class="govuk-body"><a class="govuk-link" href="/csv${window.location.search}" download="export.csv">Download all ${state.searchResults.length} records in CSV</a></p>`)
    return html.join('')
  } else {
    return ''
  }
}

const viewNoResults = () => {
  return `
    <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
    <div class="govuk-body">for ${queryDescription(state.searchParams)} </div>
  `
}

const viewSearchResults = () => {
  switch (searchState().code) {
    case 'waiting':
      document.title = `GOV.UK ${queryDescription(
        state.searchParams,
        false
      )} - ${serviceName}`
      return viewWaiting()
    case 'results':
      document.title = `GOV.UK ${queryDescription(
        state.searchParams,
        false
      )} - ${serviceName}`
      if (window.ga)
        window.ga('send', 'search', {
          search: document.title,
          resultsFound: true,
        })
      return `${viewMetaResults() || ''} ${viewResults()}` // FIXME - avoid || ''
    case 'no-results':
      document.title = `GOV.UK ${queryDescription(
        state.searchParams,
        false
      )} - ${serviceName}`
      if (window.ga)
        window.ga('send', 'search', {
          search: document.title,
          resultsFound: false,
        })
      return `${viewMetaResults() || ''} ${viewNoResults()}` // FIXME - avoid || ''
    default:
      document.title = serviceName
      return ''
  }
}

export { view }
