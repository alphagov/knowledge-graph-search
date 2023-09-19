import { state } from '../state'

const SHOWFIELDS_KEY = 'state.showFields'
const LAYOUT_KEY = 'state.panels'
const GRID_COLUMN_KEY = 'state.gridColumnState'
const PAGINATION_KEY = 'state.pagination'

export class LocalStorageService {
  static saveItem = (key, value, description = '') => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(
        `Failed to save ${description} state to localStorage:`,
        error
      )
    }
  }

  static loadItem = (key, description = '') => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(
        `Failed to load ${description} state from localStorage:`,
        error
      )
      return null
    }
  }
}

export const cacheShowFieldsState = () =>
  LocalStorageService.saveItem(SHOWFIELDS_KEY, state.showFields, 'showFields')

export const loadShowFieldsStateFromCache = () =>
  LocalStorageService.loadItem(SHOWFIELDS_KEY, 'showFields')

type LayoutState = { showFiltersPane: boolean; showFieldSet: boolean }

export const cacheLayoutState = (layoutState: LayoutState) =>
  LocalStorageService.saveItem(LAYOUT_KEY, layoutState, 'layout')

export const loadLayoutStateFromCache = () =>
  LocalStorageService.loadItem(LAYOUT_KEY, 'layout')

export const cacheGridColumnState = (gridColumnState: any) =>
  LocalStorageService.saveItem(
    GRID_COLUMN_KEY,
    gridColumnState,
    'gridColumnState'
  )

export const loadGridColumnStateFromCache = () =>
  LocalStorageService.loadItem(GRID_COLUMN_KEY, 'gridColumnState')

export const cachePaginationState = () =>
  LocalStorageService.saveItem(PAGINATION_KEY, state.pagination, 'pagination')

export const loadPaginationStateFromCache = () =>
  LocalStorageService.loadItem(PAGINATION_KEY, 'pagination')
