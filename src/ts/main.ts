import { view } from './view/view';
import { state, setQueryParamsFromQS, resetSearch } from './state';
import { searchButtonClicked, handleEvent } from './events';
import { fetchWithTimeout } from './search-api';


//==================================================
// INIT
//==================================================

const initDatabase = async function() {
  console.log('retrieving taxons and locales');
  const apiResponse = await fetchWithTimeout('/get-init-data');
  if (apiResponse.taxons.length === 0 || apiResponse.locales.length === 3) {
    throw 'Received no data from GovGraph. It might still be loading.';
  }
  return apiResponse;
};


const init = async function() {
  state.systemErrorText = null;
  try {
    const dbInitResults = await initDatabase();
    state.taxons = dbInitResults.taxons;
    state.locales = dbInitResults.locales;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      state.systemErrorText = 'It looks like GovGraph is not responding.';
    } else {
      state.systemErrorText = error;
    }
    resetSearch();
    return;
  }

  window.addEventListener('popstate', () => {
    console.log('pop!');
    setQueryParamsFromQS();
    state.searchResults = null;
    view();
    // Find if we need to run a search
    if (state.selectedWords !== '' || state.selectedLocale !== '' || state.selectedTaxon !== '' || state.linkSearchUrl !== '') {
      state.waiting = true;
      queryGraph(state, handleEvent);
    }
  });
};


//==================================================
// START
//==================================================

(async () => {
  await init();
  if (!state.systemErrorText) {
    setQueryParamsFromQS();
    view();
    // the above is needed to set the form input values from the state in case it
    // was modified by the query string
    searchButtonClicked();
  }
  view();
})();
