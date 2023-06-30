import { queryDescription } from '../utils/queryDescription'
import { id } from '../../common/utils/utils'
import { state, searchState } from '../state'
import { handleEvent } from '../events'
import { languageName } from '../../common/utils/lang'
import { viewMetaResults } from './view-metabox'
import { viewSearchPanel } from './view-search-panel'
import { EventType } from '../types/event-types'

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
      <main class="govuk-main-wrapper" id="main-content" role="main">
      ${viewErrorBanner()}
      ${viewSearchTypeSelector()}
      ${viewMainLayout()}
      <p class="govuk-body-s">
        Searches do not include history mode content, Publisher GitHub smart answers or service domains.
        Page views depend on cookie consent.
      </p>
      </main>`)
  }

  // Add event handlers
  document
    .querySelectorAll('button, input[type=checkbox][data-interactive=true]')
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
    <p class="govuk-body search-selector">
      Search for:
      <button class="${
        state.searchParams.searchType === 'keyword' ? 'active' : ''
      }" id="search-keyword">Keywords</button>
      <button class="${
        state.searchParams.searchType === 'link' ? 'active' : ''
      }" id="search-link">Links</button>
      <!-- Org search is disabled until we have tested a new design with users
        <button class="${
          state.searchParams.searchType === 'organisation' ? 'active' : ''
        }" id="search-organisation">Organisations</button>
      -->
      <button class="${
        state.searchParams.searchType === 'taxon' ? 'active' : ''
      }" id="search-taxon">Taxons</button>
      <button class="${
        state.searchParams.searchType === 'language' ? 'active' : ''
      }" id="search-language">Languages</button>
      <button class="${
        state.searchParams.searchType === 'advanced' ? 'active' : ''
      }" id="search-advanced">Advanced</button>
    </p>
  `

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
        'The databse took too long to respond. This is usually due to too many query results. Please try a more precise query.'
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
  if (state.systemErrorText || state.userErrors.length > 0) {
    html.push(`
        <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">`)

    if (state.userErrors.length > 0) {
      html.push(`
            <h1 class="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h1>
            <ul class="govuk-error-summary__list">
          `)
      state.userErrors.forEach((userError) => {
        switch (userError) {
          case 'missingWhereToSearch':
            html.push(`
              <li><a href="#search-locations-wrapper">You need to select a keyword location</a></li>`)
            break
          case 'missingArea':
            html.push(`
              <li><a href="#search-scope-wrapper">You need to select a publishing application</a></li>`)
            break
          default:
            console.log('Unknown user error code:', userError)
        }
      })
      html.push(`
            </ul>`)
    }

    html.push(`
        </div>
      `)
  }
  return html.join('')
}

const viewSearchResultsTable = () => {
  const html = []
  if (state.searchResults && state.searchResults?.length > 0) {
    const recordsToShow = state.searchResults?.slice(
      state.skip,
      state.skip + state.resultsPerPage
    )
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
        </fieldset>
        <table id="results-table" class="govuk-table">
          <tbody class="govuk-table__body">
          <tr class="govuk-table__row">
            <th scope="col" class="a11y-hidden">Page</th>`)
    Object.keys(state.showFields).forEach((key) => {
      if (state.showFields[key]) {
        html.push(
          `<th scope="col" class="govuk-table__header">${fieldName(key)}</th>`
        )
      }
    })

    recordsToShow.forEach((record, recordIndex) => {
      html.push(`
        <tr class="govuk-table__row">
          <th class="a11y-hidden">${recordIndex}</th>`)
      Object.keys(state.showFields).forEach((key) => {
        if (state.showFields[key]) {
          html.push(
            `<td class="govuk-table__cell">${fieldFormat(
              key,
              record[key]
            )}</td>`
          )
        }
      })
      html.push(`</tr>`)
    })
    html.push(`
          </tbody>
        </table>
      </div>`)
    return html.join('')
  } else {
    return ''
  }
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

    html.push(viewSearchResultsTable())

    html.push(`
      <p class="govuk-body">
        <button type="button" class="govuk-button" id="button-prev-page" ${
          state.skip < state.resultsPerPage ? 'disabled' : ''
        }>Previous</button>
        <button type="button" class="govuk-button" id="button-next-page" ${
          state.skip + state.resultsPerPage >= nbRecords ? 'disabled' : ''
        }>Next</button>
      </p>`)

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

const formatNames = (array: []) =>
  [...new Set(array)].map((x) => `“${x}”`).join(', ')

const formatDateTime = (date: any) =>
  `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`

const fieldFormatters: Record<string, any> = {
  url: {
    name: 'URL',
    format: (url: string) => `<a class="govuk-link" href="${url}">${url}</a>`,
  },
  title: { name: 'Title' },
  locale: { name: 'Language', format: languageName },
  documentType: { name: 'Document type' },
  publishing_app: { name: 'Publishing app' },
  first_published_at: {
    name: 'First published',
    format: formatDateTime,
  },
  public_updated_at: {
    name: 'Last major update',
    format: formatDateTime,
  },
  taxons: {
    name: 'Taxons',
    format: formatNames,
  },
  primary_organisation: {
    name: 'Primary publishing organisation',
    format: (x: string) => x,
  },
  all_organisations: {
    name: 'All publishing organisations',
    format: formatNames,
  },
  page_views: {
    name: 'Page views',
    format: (val: string) => (val ? parseInt(val).toString() : '<5'),
  },
  withdrawn_at: {
    name: 'Withdrawn at',
    format: (date: string) => (date ? formatDateTime(date) : 'not withdrawn'),
  },
  withdrawn_explanation: {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'n/a',
  },
}

const fieldName = function (key: string) {
  const f = fieldFormatters[key]
  return f ? f.name : key
}

const fieldFormat = function (key: string, val: string | number): string {
  const f = fieldFormatters[key]
  return f && f.format ? f.format(val) : val
}

export { view }
