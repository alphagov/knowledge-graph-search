import { id } from '../../common/utils/utils'
import { state } from '../state'
import { fieldFormat, fieldName } from './utils'
import { viewPagination } from './view-pagination'

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
    // onRowDataChanged: function (params) {
    // params.columnApi.autoSizeColumns(['url', 'title'])
    // @ts-ignore
    // gridOptions.api.sizeColumnsToFit()
    // },
    // onColumnVisible: function (params) {
    // params.columnApi.autoSizeColumns(['url', 'title'])
    // @ts-ignore
    // gridOptions.api.sizeColumnsToFit()
    // },
    suppressDragLeaveHidesColumns: true,

    pagination: true,
    paginationPageSize: 10,
    suppressPaginationPanel: true,
    domLayout: 'autoHeight',
  }

  const gridDiv = id('results-grid-container')
  /* eslint-disable */ // @ts-ignore
  const grid = new agGrid.Grid(gridDiv, gridOptions)
  window.addEventListener('resize', function () {
    // @ts-ignore
    // gridOptions.api.sizeColumnsToFit()
  })

  viewPagination(gridOptions)
  // @ts-ignore
  gridOptions.api.addEventListener('paginationChanged', function () {
    viewPagination(gridOptions)
  })

  return { grid, gridOptions }
}

export { createAgGrid }
