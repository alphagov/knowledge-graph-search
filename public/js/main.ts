import { view } from './view/view';
import { state, setQueryParamsFromQS, resetSearch } from './state';
import { searchButtonClicked } from './events';
import { initNeo4j } from './neo4j';


//==================================================
// INIT
//==================================================

const init = async function() {
  state.errorText = null;
  try {
    await initNeo4j();
  } catch (e) {
    console.log('Failed to connect to the GovGraph', e);
    state.errorText = `Error connecting to the GovGraph.<br/></br/>
Possible causes:<br/>
<br/>
- The GovGraph only runs on weekdays from 9am to 7pm<br/><br/>
- There's a problem with GovGraph. Please contact the Data Products team.`;
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
  if (!state.errorText) {
    setQueryParamsFromQS();
    view();
    // the above is needed to set the form input values from the state in case it
    // was modified by the query string
    searchButtonClicked();
  }
  view();
})();
