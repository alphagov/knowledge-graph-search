import { id } from '../../common/utils/utils'
import { state } from '../state'
import { fieldFormat, fieldName } from './utils'
import { viewPagination } from './view-pagination'
import config from '../config'

const getGridContainer = () => id('results-grid-container')

const adjustGridHeight = (params) => {
  if (state.resultsPerPage > config.pagination.maxResultsBeforeScrolling) {
    const cellHeight = (document.querySelector('.ag-row') as HTMLElement)
      .offsetHeight
    const newHeightPx = cellHeight * config.pagination.maxResultsBeforeScrolling
    getGridContainer().style.height = `${newHeightPx}px`
    params.api.setDomLayout(null)
  } else {
    getGridContainer().style.height = ''
    params.api.setDomLayout('autoHeight')
  }
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
    // suppressSizeToFit: ['url', 'title'].includes(field),
  }))
  console.log({ columnDefs })

  const gridOptions = {
    rowData,
    columnDefs,
    onFirstDataRendered: function (params) {
      params.columnApi.autoSizeColumns(['url', 'title'])
      // @ts-ignore
      // gridOptions.api.sizeColumnsToFit()
    },
    onRowDataChanged: function (params) {
      params.columnApi.autoSizeColumns(['url', 'title'])
      // @ts-ignore
      // gridOptions.api.sizeColumnsToFit()
    },
    onPaginationChanged: function (params) {
      adjustGridHeight(params)
      viewPagination(gridOptions)
      params.columnApi.autoSizeColumns(['url', 'title'])
    },
    suppressDragLeaveHidesColumns: true,
    pagination: true,
    paginationPageSize: 10,
    suppressPaginationPanel: true,
    domLayout: 'autoHeight',
  }

  const gridDiv = getGridContainer()
  /* eslint-disable */ // @ts-ignore
  const grid = new agGrid.Grid(gridDiv, gridOptions)

  // window.addEventListener('resize', function () {
  //   // @ts-ignore
  //   gridOptions.api.sizeColumnsToFit()
  // })

  return { grid, gridOptions }
}

export { createAgGrid }
