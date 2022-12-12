import { view } from './view/view';
import { state, setQueryParamsFromQS, resetSearch } from './state';
import { searchButtonClicked } from './events';
import { initNeo4j } from './neo4j';


//==================================================
// INIT
//==================================================

const init = async function() {
  state.systemErrorText = null;
  try {
    const neo4jInitResults = await initNeo4j();
    state.taxons = neo4jInitResults.taxons;
    state.locales = neo4jInitResults.locales;
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
    setQueryParamsFromQS();
    view();
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
