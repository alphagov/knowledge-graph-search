const SHOWFIELDS_KEY = 'state.showFields'
const LAYOUT_KEY = 'state.panels'

export const saveShowFieldsState = (showFields: any) => {
  try {
    localStorage.setItem(SHOWFIELDS_KEY, JSON.stringify(showFields))
  } catch (error) {
    console.error('Failed to save layout state to localStorage:', error)
  }
}

export const loadShowFieldsState = () => {
  try {
    const data = localStorage.getItem(SHOWFIELDS_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load layout state from localStorage:', error)
    return null
  }
}

type LayoutState = { showFiltersPane: boolean; showFieldSet: boolean }

export const saveLayoutState = (layoutState: LayoutState) => {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layoutState))
  } catch (error) {
    console.error('Failed to save layout state to localStorage:', error)
  }
}

export const loadLayoutState = () => {
  try {
    const data = localStorage.getItem(LAYOUT_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load layout state from localStorage:', error)
    return null
  }
}
