import { view } from './view/view'
import {
  state,
  setQueryParamsFromQS,
  resetSearchState,
  initState,
} from './state'
import { searchButtonClicked, handleEvent } from './events'
import { fetchWithTimeout, queryBackend } from './search-api'
import config from './config'
import { defaultAllLanguagesOption } from '../common/utils/lang'
import {
  PublishingStatus,
  PoliticalStatus,
} from '../common/types/search-api-types'

//= =================================================
// INIT
//= =================================================

// dummy comment

const signon = async function () {
  state.signonProfileData = await fetchWithTimeout('/me')
}

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
    state.documentTypes = dbInitResults.documentTypes
    state.governments = dbInitResults.governments
    state.publishingApps = dbInitResults.publishingApps
    state.persons = dbInitResults.persons
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      state.systemErrorText = 'It looks like the backend is not responding.'
    } else {
      state.systemErrorText = error
    }
    resetSearchState()
    return
  }

  window.addEventListener('popstate', () => {
    setQueryParamsFromQS()
    state.searchResults = null
    view()

    // Find if we need to run a search
    if (
      state.searchParams.selectedWords !== '' ||
      (state.searchParams.language !== '' &&
        state.searchParams.language !== defaultAllLanguagesOption) ||
      state.searchParams.taxon !== '' ||
      state.searchParams.publishingOrganisation !== '' ||
      state.searchParams.linkSearchUrl !== '' ||
      state.searchParams.phoneNumber !== '' ||
      state.searchParams.documentType !== '' ||
      state.searchParams.publishingApp !== '' ||
      state.searchParams.publishingStatus !== PublishingStatus.All ||
      state.searchParams.politicalStatus !== PoliticalStatus.Any ||
      state.searchParams.government !== ''
    ) {
      state.waiting = true
      console.log('REQUERYING BACKEND')
      queryBackend(state.searchParams, handleEvent)
    }
  })
}

//= =================================================
// START
//= =================================================

const initWithoutHMR = async () => {
  initState()
  await signon()
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
  initState()
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
