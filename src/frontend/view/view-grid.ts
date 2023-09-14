import { id } from '../../common/utils/utils'
import { state } from '../state'
import {
  loadGridColumnState,
  saveGridColumnState,
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

  const linkCellRenderer = (params) => params.value
  const columnDefs = enabledFields.map((field) => ({
    field,
    headerName: fieldName(field),
    cellRenderer: field === 'url' ? linkCellRenderer : null,
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
    paginationPageSize: state.resultsPerPage,
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

  const cachedColumnState = loadGridColumnState()
  if (cachedColumnState) {
    // @ts-ignore
    gridOptions.columnApi.applyColumnState({
      state: cachedColumnState,
      applyOrder: true,
    })
  }

  // @ts-ignore
  gridOptions.api.addEventListener('columnMoved', () => {
    // @ts-ignore
    const colState = gridOptions.columnApi.getColumnState()
    saveGridColumnState(colState)
  })

  document.querySelector('ag-root-wrapper').setAttribute('scrollbarwidth', '8')

  gridDiv.appendChild(overlayElement())

  return { grid, gridOptions }
}

export { createAgGrid }
