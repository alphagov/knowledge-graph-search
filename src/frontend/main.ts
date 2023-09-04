import { view } from './view/view'
import { state, setQueryParamsFromQS, resetSearch } from './state'
import { searchButtonClicked, handleEvent } from './events'
import { fetchWithTimeout, queryBackend } from './search-api'
import config from './config'

//= =================================================
// INIT
//= =================================================

// dummy comment

const getInitialData = async function () {
  console.log('retrieving taxons, locales and organisations')
  const apiResponse = await fetchWithTimeout('/get-init-data')
  if (
    apiResponse.taxons.length === 0 ||
    apiResponse.locales.length === 3 ||
    apiResponse.organisations.length === 0
  ) {
    throw new Error('Received no or incomplete data from the backend.')
  }
  return apiResponse
}

const fetchInitialData = async function () {
  state.systemErrorText = null
  try {
    const dbInitResults = await getInitialData()
    state.taxons = dbInitResults.taxons
    state.organisations = dbInitResults.organisations
    state.locales = dbInitResults.locales
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      state.systemErrorText = 'It looks like the backend is not responding.'
    } else {
      state.systemErrorText = error
    }
    resetSearch()
    return
  }

  window.addEventListener('popstate', () => {
    setQueryParamsFromQS()
    state.searchResults = null
    view()
    // Find if we need to run a search
    if (
      state.searchParams.selectedWords !== '' ||
      state.searchParams.selectedLocale !== '' ||
      state.searchParams.selectedTaxon !== '' ||
      state.searchParams.selectedOrganisation !== '' ||
      state.searchParams.linkSearchUrl !== ''
    ) {
      state.waiting = true
      queryBackend(state.searchParams, handleEvent)
    }
  })
}

//= =================================================
// START
//= =================================================

const initWithoutHMR = async () => {
  await fetchInitialData()
  if (!state.systemErrorText) {
    setQueryParamsFromQS()
    view()
    // the above is needed to set the form input values from the state in case it
    // was modified by the query string
    searchButtonClicked()
  }
  view()
}

const initWithHMR = async () => {
  const { hasStateInCache, setStateFromCache } = require('./utils/hmr')
  const stateInCache = await hasStateInCache()
  if (stateInCache) {
    await setStateFromCache()
    view()
  } else {
    await initWithoutHMR()
  }
}

config.enableHMR ? initWithHMR() : initWithoutHMR()
