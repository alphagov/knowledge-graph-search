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
    await initNeo4j();
  } catch (errorText) {
    state.systemErrorText = errorText;
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
