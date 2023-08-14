import { queryDescription } from '../utils/queryDescription'
import { id } from '../../common/utils/utils'
import { state, searchState } from '../state'
import { handleEvent } from '../events'
import { languageName } from '../../common/utils/lang'
import { viewMetaResults } from './view-metabox'
import { viewSearchPanel } from './view-search-panel'
import { EventType } from '../types/event-types'
import { USER_ERRORS } from '../enums/constants'

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
  // const { grid, gridOptions } = createAgGrid()
  // setTimeout(() => {
  //   if (!grid || !gridOptions) {
  //     return
  //   }
  //   const oldData = grid.gridOptions.rowData
  //   const newData = oldData.filter((d) => d.locale !== 'en')
  //   console.log({ oldData })
  //   //@ts-ignore
  //   gridOptions.api.setRowData(newData)
  //   // updateRowData(newData)
  // }, 2000)

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
        </fieldset>`)
    html.push(
      '<div id="results-grid-container" style="height: 500px; margin-top: 10px;" class="ag-theme-alpine"></div>'
    )
    html.push('<div id="pagination-container"></div>')
    html.push(`
      </div>`)
    return html.join('')
  } else {
    return ''
  }
}

const createAgGrid = () => {
  if (!state.searchResults || state.searchResults?.length <= 0) {
    return {}
  }
  const currentPageRecords = state.searchResults
  // const currentPageRecords = state.searchResults?.slice(
  //   state.skip,
  //   state.skip + state.resultsPerPage
  // )
  // const currentPageRecords = state.searchResults
  const enabledFields = Object.entries(state.showFields)
    .filter(([, v]) => v)
    .map(([key]) => key)

  const rowData = currentPageRecords.map((record) =>
    Object.entries(record).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: fieldFormat(k, v as string) }),
      {}
    )
  )

  const linkCellRenderer = (params) => params.value
  const columnDefs = enabledFields.map((field) => ({
    field,
    headerName: fieldName(field),
    cellRenderer: field === 'url' ? linkCellRenderer : null,
  }))

  const gridOptions = {
    rowData,
    columnDefs,
    onFirstDataRendered: function (params) {
      params.api.sizeColumnsToFit()
    },
    onRowDataChanged: function (params) {
      params.api.sizeColumnsToFit()
    },
    onColumnVisible: function (params) {
      params.api.sizeColumnsToFit()
    },
    suppressDragLeaveHidesColumns: true,

    pagination: true,
    paginationPageSize: 10,
    suppressPaginationPanel: true,
  }

  const gridDiv = id('results-grid-container')
  // const grid = new Grid(gridDiv, gridOptions)
  /* eslint-disable */ // @ts-ignore
  const grid = new agGrid.Grid(gridDiv, gridOptions)
  window.addEventListener('resize', function () {
    // @ts-ignore
    gridOptions.api.sizeColumnsToFit()
  })

  viewPagination(gridOptions)
  // @ts-ignore
  gridOptions.api.addEventListener('paginationChanged', function () {
    viewPagination(gridOptions)
  })

  return { grid, gridOptions }
}

const viewPagination = (gridOptions) => {
  // This component aims at following GOV.UK's design system for pagination
  // But with support for dynamic JS
  // https://design-system.service.gov.uk/components/pagination/
  const totalPages = gridOptions.api.paginationGetTotalPages()
  const currentPage = gridOptions.api.paginationGetCurrentPage()

  const bindPaginationEvents = () => {
    const createPaginationBinding = (selector: string, func) =>
      document.querySelector(selector)?.addEventListener('click', function (e) {
        e.preventDefault()
        func()
      })

    createPaginationBinding('.govuk-pagination__prev a', () =>
      gridOptions.api.paginationGoToPreviousPage()
    )
    createPaginationBinding('.govuk-pagination__next a', () =>
      gridOptions.api.paginationGoToNextPage()
    )
    createPaginationBinding('.govuk-pagination__item.first-item a', () =>
      gridOptions.api.paginationGoToFirstPage()
    )
    createPaginationBinding('.govuk-pagination__item.last-item a', () =>
      gridOptions.api.paginationGoToLastPage()
    )
    createPaginationBinding('.govuk-pagination__item.n-minus-1-item a', () =>
      gridOptions.api.paginationGoToPage(currentPage - 1)
    )
    createPaginationBinding('.govuk-pagination__item.n-minus-2-item a', () =>
      gridOptions.api.paginationGoToPage(currentPage - 2)
    )
    createPaginationBinding('.govuk-pagination__item.n-plus-1-item a', () =>
      gridOptions.api.paginationGoToPage(currentPage + 1)
    )
    createPaginationBinding('.govuk-pagination__item.n-plus-2-item a', () =>
      gridOptions.api.paginationGoToPage(currentPage + 2)
    )
    createPaginationBinding('.govuk-pagination__item.n-plus-3-item a', () =>
      gridOptions.api.paginationGoToPage(currentPage + 3)
    )
  }

  const buildListItems = (description) => {
    let html = ''

    description.forEach((item) => {
      if (item === 'ellipsis') {
        html += `<li class="govuk-pagination__item govuk-pagination__item--ellipses">&ctdot;</li>`
      } else {
        const extraItemClasses = [
          item === currentPage + 1 ? 'govuk-pagination__item--current' : '',
          item === 1 ? 'first-item' : '',
          item === totalPages ? 'last-item' : '',
          item === currentPage - 1 ? 'n-minus-2-item' : '',
          item === currentPage ? 'n-minus-1-item' : '',
          item === currentPage + 2 ? 'n-plus-1-item' : '',
          item === currentPage + 3 ? 'n-plus-2-item' : '',
          item === currentPage + 4 ? 'n-plus-3-item' : '',
        ]
        const toAppend = `
        <li class="govuk-pagination__item ${extraItemClasses.join(' ')}">
        <a class="govuk-link govuk-pagination__link" href="#" aria-label="Page ${item}" ${
          item === currentPage ? 'aria-current="page"' : ''
        }>
          ${item}
        </a>
      </li>
        `
        html += toAppend
      }
    })

    return html
  }

  const viewConditionalPaginationHtml = () => {
    if (totalPages <= 9) {
      // Display all the pages with no ellipsis
      return buildListItems(Array.from({ length: totalPages }, (_, i) => i + 1))
    } else if ([0, 1, 2].includes(currentPage)) {
      return buildListItems([1, 2, 3, 4, 'ellipsis', totalPages])
    } else if (currentPage > 2 && currentPage < totalPages - 3) {
      let pagesToShow = [1, 'ellipsis']
      pagesToShow.push(currentPage, currentPage + 1, currentPage + 2)
      pagesToShow.push('ellipsis', totalPages)
      return buildListItems(pagesToShow)
    } else if (currentPage === totalPages - 3) {
      return buildListItems([
        1,
        'ellipsis',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ])
    } else if ([totalPages-2, totalPages-1].includes(currentPage) {
      return buildListItems([
        1,
        'ellipsis',
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ])
    }
  }

  const paginationHtml = `
  <nav class="govuk-pagination" role="navigation" aria-label="results">
  ${
    currentPage > 0 ? `<div class="govuk-pagination__prev">
    <a class="govuk-link govuk-pagination__link" href="#" rel="prev">
      <svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path>
      </svg>
      <span class="govuk-pagination__link-title">Previous</span></a>
  </div>` : ""
  }
  <ul class="govuk-pagination__list">
    ${viewConditionalPaginationHtml()}
  </ul>
  ${currentPage<totalPages-1?`<div class="govuk-pagination__next">
    <a class="govuk-link govuk-pagination__link" href="#" rel="next"> <span class="govuk-pagination__link-title">Next</span> <svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
        <path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path>
      </svg></a>
  </div>`:""}
</nav>`

  id('pagination-container').innerHTML = paginationHtml
  bindPaginationEvents()
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
  contentId: { name: 'Content ID' },
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
