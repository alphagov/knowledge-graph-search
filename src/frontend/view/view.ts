import { queryDescription } from '../utils/queryDescription'
import { id } from '../../common/utils/utils'
import { state, searchState } from '../state'
import { handleEvent } from '../events'
import { viewMetaResults } from './view-metabox'
import { viewAdvancedSearchPanel, viewSearchPanel } from './view-search-panel'
import { EventType } from '../types/event-types'
import { USER_ERRORS } from '../enums/constants'
import { fieldName } from './utils'
import { createAgGrid } from './view-grid'
import { viewSideFilters } from './view-side-filters'
import govukPostInitScripts from './postInitScripts'
import {
  PublishingStatus,
  SearchType,
} from '../../common/types/search-api-types'
import config from '../config'

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

  govukPostInitScripts()
}

const viewSearchTypeSelector = () => `
  <div class="govuk-tabs" data-module="govuk-tabs">
  <span class="govuk-tabs__title">Search for</span>
  <ul class="govuk-tabs__list">
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === SearchType.Keyword
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-keywords" id="search-keywords">
      Keywords
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === SearchType.Link
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-links" id="search-links">
      Links
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === SearchType.Organisation
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-orgs" id="search-orgs">
      Organisations
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === SearchType.Taxon
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-taxons" id="search-taxons">
      Topic tags
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === 'language'
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-langs" id="search-langs">
      Languages
      </a>
    </li>
    <li class="govuk-tabs__list-item ${
      state.searchParams.searchType === SearchType.Advanced
        ? 'govuk-tabs__list-item--selected'
        : ''
    }">
      <a class="govuk-tabs__tab" href="#search-adv" id="search-adv">
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
      result.push(viewSearchResults())
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

    if (state.searchParams.publishingStatus === PublishingStatus.NotWithdrawn) {
      excludeList.push(...['withdrawn_at', 'withdrawn_explanation'])
    }
    return `
    <div class="govuk-fieldset header-options-container" ${
      state.waiting && 'disabled="disabled"'
    }>
      <legend class="govuk-fieldset__legend govuk-fieldset__legend--m">
        Customise table headers
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
                ${state.showFields[key] ? 'checked' : ''}/>
              <label for="show-field-${key}" class="govuk-label govuk-checkboxes__label">${fieldName(
                key
              )}</label>
            </div>`
            : ''
        )
        .join('')}
      </div>
    </div>
  `
  }
  html.push(`<div class="govuk-body search-results-table-container">
  ${state.showFieldSet ? viewFieldSet() : ''}
  <div id="results-grid-container" class="ag-theme-alpine"></div>
  <div id="pagination-container"></div>
  </div>`)
  return html.join('')
}

const viewWaiting = () => `
  <div aria-live="polite" role="region">
    <div class="govuk-body">${queryDescription({
      searchParams: state.searchParams,
      waiting: true,
    })}</div>
    <p class="govuk-body-s">Some queries may take up to a minute</p>
  </div>
`

const viewResults = function () {
  if (state.searchResults) {
    const html = []
    const nbRecords = state.searchResults.length

    html.push(`<div class="before-results-container">`)
    html.push(`<div class="results-comments">`)
    if (nbRecords < 10000) {
      html.push(
        `<div class="govuk-body">${queryDescription({
          searchParams: state.searchParams,
          nbRecords,
        })}</div>`
      )
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

    // .results-comments
    html.push(`</div>`)

    if (config.featureFlags.enableInfoBox) {
      html.push(viewMetaResults())
    }

    // .before-results-container
    html.push(`</div>`)

    const resultsContainer = `
    <div class="results-container ${
      state.showFiltersPane ? '' : 'hide-filters'
    }">
      <div class='results-container-row-1-headers'>
        <div class="hide-filters-button-container">
          <button id="toggle-filters-btn" class="govuk-button govuk-button--secondary">${
            state.showFiltersPane ? 'Hide Filters' : 'Show Filters'
          }</button>
        </div>
        <button class="govuk-button govuk-button--secondary" id="toggle-header-options-btn">${
          state.showFieldSet ? 'Hide header options' : 'Show header options'
        }</button>
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

    html.push(`
      <p class="govuk-body govuk-!-margin-top-6"><a class="govuk-link" href="/csv${window.location.search}" download="export.csv">Download all ${state.searchResults.length} records in CSV</a></p>`)
    return html.join('')
  } else {
    return ''
  }
}

const viewNoResults = () => {
  return `
    <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
    <div class="govuk-body">for ${queryDescription({
      searchParams: state.searchParams,
    })} </div>
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

      return [
        config.featureFlags.enableInfoBox ? viewMetaResults() : '',
        viewNoResults(),
      ].join('')

    default:
      document.title = serviceName
      return ''
  }
}

export { view }
