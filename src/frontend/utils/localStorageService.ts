const SHOWFIELDS_KEY = 'state.showFields'

export const saveShowFieldsState = (showFields: any) => {
  try {
    localStorage.setItem(SHOWFIELDS_KEY, JSON.stringify(showFields))
  } catch (error) {
    console.error('Failed to save state to localStorage:', error)
  }
}

export const loadShowFieldsState = () => {
  try {
    const data = localStorage.getItem(SHOWFIELDS_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load state from localStorage:', error)
    return null
  }
}
