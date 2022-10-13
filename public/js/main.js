import { view } from './view/view.js';
import { state, setQueryParamsFromQS, resetSearch } from './state.js';
import { searchButtonClicked } from './events.js';
import { initNeo4j } from './neo4j.js';


//==================================================
// INIT
//==================================================

const init = async function() {
  // decide if we're showing the feedback banner
  state.displayFeedbackBanner = !document.cookie.includes('feedback_banner_dismissed=true');
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
    searchButtonClicked();
  }
  view();
})();
