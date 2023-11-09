/* eslint-disable */
// @ts-nocheck
import {
  KeywordLocation,
  SearchType,
} from '../../common/types/search-api-types'
import { id } from '../../common/utils/utils'
import { state } from '../state'
import { formatDocumentType, formatPublishingApp } from '../utils/formatters'
import {
  loadGridColumnStateFromCache,
  cacheGridColumnState,
} from '../utils/localStorageService'
import { fieldFormat, fieldName } from './utils'
import { viewPagination } from './view-pagination'
import CustomAgGridHeader from './customAgGridHeader'
import debounce from '../utils/debounce'

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

  const excludeOccurrences =
    state.searchParams.searchType === SearchType.Language ||
    state.searchParams.keywordLocation === KeywordLocation.Title

  const excludedFields = [excludeOccurrences ? 'occurrences' : '']

  const enabledFields = Object.entries(state.showFields)
    .filter(([field, enable]) => {
      return enable && !excludedFields.includes(field as string)
    })
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
  const parsePageViews = (x) => (x.charAt(0) === '<' ? 0 : parseInt(x))

  const sortConfig = {
    page_views: {
      sortable: true,
      sort: state.sorting.page_views,
      comparator: (a, b) => {
        return parsePageViews(a) - parsePageViews(b)
      },
    },
  }
  const columnDefs = enabledFields.map((field) => ({
    field,
    headerName: fieldName(field),
    cellRenderer: cellRenderers[field] || null,
    resizable: true,
    suppressSizeToFit: ['url', 'title'].includes(field),
    width: ['url', 'title'].includes(field) ? 500 : null,
    sortable: field !== 'contentId',
    ...(sortConfig[field] || {}),
  }))

  const gridOptions = {
    rowData,
    columnDefs,
    onPaginationChanged: function () {
      viewPagination(gridOptions)
    },
    suppressColumnMoveAnimation: true,
    suppressDragLeaveHidesColumns: true,
    pagination: true,
    paginationPageSize: state.pagination.resultsPerPage,
    suppressPaginationPanel: true,
    domLayout: 'autoHeight',
    ensureDomOrder: true,
    enableCellTextSelection: true,
    alwaysShowHorizontalScroll: true,
    alwaysShowVerticalScroll: true,
    components: {
      agColumnHeader: CustomAgGridHeader,
    },
  }

  const gridDiv = id('results-grid-container')
  /* eslint-disable */
  const grid = new agGrid.Grid(gridDiv, gridOptions)

  const initColumnState = async (callBack) => {
    const cachedColumnState = loadGridColumnStateFromCache()
    if (cachedColumnState) {
      gridOptions.columnApi.applyColumnState({
        state: cachedColumnState,
        applyOrder: true,
      })
    }
    callBack()
  }
  const initGoToCurrentPage = () => {
    // For cached pagination, we need to set the current page after the grid has been initialised
    if (
      state.pagination.currentPage !==
      gridOptions.api.paginationGetCurrentPage()
    ) {
      gridOptions.api.paginationGoToPage(state.pagination.currentPage)
    }
  }

  const cacheColumnState = () => {
    const colState = gridOptions.columnApi.getColumnState()
    cacheGridColumnState(colState)
  }
  const addOverlayElementForPaginationRefresh = () =>
    id('grid-wrapper').appendChild(overlayElement())

  const onColumnMoved = () => cacheColumnState()
  const onGridSort = () => cacheColumnState()
  const onColumnResized = debounce((event: any) => cacheColumnState(), 100)
  const onGridReady = () => {
    addOverlayElementForPaginationRefresh()
    addEventListenners()
  }

  const addEventListenners = () => {
    // Grid event listenners
    gridOptions.api.addEventListener('gridReady', onGridReady)
    gridOptions.api.addEventListener('columnMoved', onColumnMoved)
    gridOptions.api.addEventListener('columnResized', onColumnResized)
    gridOptions.api.addEventListener('sortChanged', onGridSort)
  }

  initGoToCurrentPage()
  initColumnState(onGridReady)

  return { grid, gridOptions }
}

export { createAgGrid }
