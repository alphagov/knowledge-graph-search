import { view } from './view/view';
import { state, setQueryParamsFromQS, resetSearch } from './state';
import { searchButtonClicked, handleEvent } from './events';
import { initNeo4j, queryGraph } from './neo4j';


//==================================================
// INIT
//==================================================

const init = async function() {
  state.systemErrorText = null;
  try {
    await initNeo4j();
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
