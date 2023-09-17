import { id } from '../../common/utils/utils'
import { state } from '../state'
import { formatDocumentType, formatPublishingApp } from '../utils/formatters'
import {
  loadGridColumnStateFromCache,
  cacheGridColumnState,
} from '../utils/localStorageService'
import { fieldFormat, fieldName } from './utils'
import { viewPagination } from './view-pagination'

const overlayElement = () => {
  const el = document.createElement('div')
  el.id = 'grid-overlay'
  return el
}

const createAgGrid = () => {
  if (!state.searchResults || state.searchResults?.length <= 0) {
    return {}
  }
  const currentPageRecords = state.searchResults
  const enabledFields = Object.entries(state.showFields)
    .filter(([, v]) => v)
    .map(([key]) => key)

  const rowData = currentPageRecords.map((record) =>
    Object.entries(record).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: fieldFormat(k, v as string) }),
      {}
    )
  )

  const cellRenderers = {
    url: (p) => p.value,
    documentType: (p) => formatDocumentType(p.value),
    publishing_app: (p) => formatPublishingApp(p.value),
  }
  const columnDefs = enabledFields.map((field) => ({
    field,
    headerName: fieldName(field),
    cellRenderer: cellRenderers[field] || null,
    resizable: true,
    suppressSizeToFit: ['url', 'title'].includes(field),
    width: ['url', 'title'].includes(field) ? 500 : null,
  }))

  const gridOptions = {
    rowData,
    columnDefs,
    onPaginationChanged: function () {
      viewPagination(gridOptions)
    },
    suppressDragLeaveHidesColumns: true,
    pagination: true,
    paginationPageSize: state.pagination.resultsPerPage,
    suppressPaginationPanel: true,
    domLayout: 'autoHeight',
    ensureDomOrder: true,
    enableCellTextSelection: true,
    alwaysShowHorizontalScroll: true,
    alwaysShowVerticalScroll: true,
  }

  const gridDiv = id('results-grid-container')
  /* eslint-disable */ // @ts-ignore
  const grid = new agGrid.Grid(gridDiv, gridOptions)

  const cachedColumnState = loadGridColumnStateFromCache()
  if (cachedColumnState) {
    // @ts-ignore
    gridOptions.columnApi.applyColumnState({
      state: cachedColumnState,
      applyOrder: true,
    })
  }

  // For cached pagination, we need to set the current page after the grid has been initialised
  if (
    // @ts-ignore
    state.pagination.currentPage !== gridOptions.api.paginationGetCurrentPage()
  ) {
    // @ts-ignore
    gridOptions.api.paginationGoToPage(state.pagination.currentPage)
  }

  // @ts-ignore
  gridOptions.api.addEventListener('columnMoved', () => {
    // @ts-ignore
    const colState = gridOptions.columnApi.getColumnState()
    cacheGridColumnState(colState)
  })

  gridDiv.appendChild(overlayElement())

  return { grid, gridOptions }
}

export { createAgGrid }
