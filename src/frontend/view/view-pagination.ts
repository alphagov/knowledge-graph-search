import { id } from '../../common/utils/utils'
import { state } from '../state'
import config from '../config'

// Prepare the grid height before updating its results per page
const adjustGridHeight = (gridOptions, newResultsPerPage) => {
  const oldResultsPerPage = state.resultsPerPage
  const { maxResultsBeforeScrolling } = config.pagination
  if (newResultsPerPage > maxResultsBeforeScrolling) {
    let newGridHeight = 0
    if (oldResultsPerPage === maxResultsBeforeScrolling) {
      newGridHeight = (document.querySelector('.ag-root') as HTMLElement)
        .offsetHeight
    } else {
      newGridHeight =
        (document.querySelector('.ag-row') as HTMLElement).offsetHeight *
        config.pagination.maxResultsBeforeScrolling
    }
    id('results-grid-container').style.height = `${newGridHeight}px`
    gridOptions.api.setDomLayout(null)
  } else {
    id('results-grid-container').style.height = ''
    gridOptions.api.setDomLayout('autoHeight')
  }
}

const bindPaginationEvents = (gridOptions, currentPage) => {
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
  createPaginationBinding(
    '.govuk-pagination__item.govuk-pagination__item--current a',
    () => {
      // Do nothing, just disable the default link behaviour
    }
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

const bindResultsPerPageSelectEvents = (gridOptions) => {
  id('resultsPerPage-select')?.addEventListener('change', function (event) {
    const selectedValue = (<HTMLSelectElement>event.target).value
    const newResultsPerPage = parseInt(selectedValue, 10)
    adjustGridHeight(gridOptions, newResultsPerPage)
    state.resultsPerPage = newResultsPerPage
    gridOptions.api.paginationSetPageSize(newResultsPerPage)
  })
}

const buildPaginationHtml = (totalPages, currentPage) => {
  const buildConditionalPaginationHtml = () => {
    if (totalPages <= 9) {
      // Display all the pages with no ellipsis
      return buildListItems(Array.from({ length: totalPages }, (_, i) => i + 1))
    }

    if ([0, 1, 2, 3].includes(currentPage)) {
      const firstButtons = Array.from(
        { length: currentPage + 2 },
        (_, i) => i + 1
      )
      return buildListItems([...firstButtons, 'ellipsis', totalPages])
    } else if (currentPage > 2 && currentPage < totalPages - 3) {
      const pagesToShow = [1, 'ellipsis']
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
    } else if (
      [totalPages - 3, totalPages - 2, totalPages - 1].includes(currentPage)
    ) {
      const distance = totalPages - (currentPage + 1)
      const lastButtons = Array.from(
        { length: distance + 2 },
        (_, i) => totalPages - (distance + 1) + i
      )
      return buildListItems([1, 'ellipsis', ...lastButtons])
    }

    if ([0, 1, 2].includes(currentPage)) {
      return buildListItems([1, 2, 3, 4, 'ellipsis', totalPages])
    } else if (currentPage > 2 && currentPage < totalPages - 3) {
      const pagesToShow = [1, 'ellipsis']
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
    } else if ([totalPages - 2, totalPages - 1].includes(currentPage)) {
      return buildListItems([
        1,
        'ellipsis',
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ])
    }
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

  const paginationHtml = `
        <nav class="govuk-pagination" role="navigation" aria-label="results">
        ${
          currentPage > 0
            ? `<div class="govuk-pagination__prev">
          <a class="govuk-link govuk-pagination__link" href="#" rel="prev">
            <svg class="govuk-pagination__icon govuk-pagination__icon--prev" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
              <path d="m6.5938-0.0078125-6.7266 6.7266 6.7441 6.4062 1.377-1.449-4.1856-3.9768h12.896v-2h-12.984l4.2931-4.293-1.414-1.414z"></path>
            </svg>
            <span class="govuk-pagination__link-title">Previous</span></a>
        </div>`
            : ''
        }
        <ul class="govuk-pagination__list">
          ${buildConditionalPaginationHtml()}
        </ul>
        ${
          currentPage < totalPages - 1
            ? `<div class="govuk-pagination__next">
          <a class="govuk-link govuk-pagination__link" href="#" rel="next"> <span class="govuk-pagination__link-title">Next</span> <svg class="govuk-pagination__icon govuk-pagination__icon--next" xmlns="http://www.w3.org/2000/svg" height="13" width="15" aria-hidden="true" focusable="false" viewBox="0 0 15 13">
              <path d="m8.107-0.0078125-1.4136 1.414 4.2926 4.293h-12.986v2h12.896l-4.1855 3.9766 1.377 1.4492 6.7441-6.4062-6.7246-6.7266z"></path>
            </svg></a>
        </div>`
            : ''
        }
      </nav>`

  return paginationHtml
}

const viewResultsPerPageSelector = () => {
  return `
  <div class="govuk-form-group">
    <label class="govuk-label" for="resultsPerPageSelect">
      Results per page
    </label>
    <select class="govuk-select" id="resultsPerPage-select" name="resultsPerPageSelect">
      ${config.pagination.options
        .filter((s) => s < (state?.searchResults || []).length)
        .map(
          (s) =>
            `<option value="${s}" ${
              s === state.resultsPerPage ? 'selected' : ''
            }>${s}</option>`
        )}
    </select>
  </div>
  `
}

export const viewPagination = (gridOptions) => {
  // This component aims at following GOV.UK's design system for pagination
  // But with support for dynamic JS
  // https://design-system.service.gov.uk/components/pagination/
  const totalPages = gridOptions.api.paginationGetTotalPages()
  const currentPage = gridOptions.api.paginationGetCurrentPage()

  const pageSizeSelectHtml = viewResultsPerPageSelector()
  const paginationHtml = buildPaginationHtml(totalPages, currentPage)
  const paginationContainer = id('pagination-container')
  if (paginationContainer) {
    paginationContainer.innerHTML = `${pageSizeSelectHtml}${paginationHtml}`
  }
  bindPaginationEvents(gridOptions, currentPage)
  bindResultsPerPageSelectEvents(gridOptions)
}
