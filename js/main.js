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


  // Look if there's a file with authentication params
  await fetch('params.json')
    .then(async response => {
      const data = await response.json();

      state.server = data.server;
      state.user = data.user;
      state.password = data.password;
    }).catch(error => {
      console.warn(error);
      state.errorText = 'Failed to retrieve credentials to connect to the Knowledge Graph';
    });


  try {
    await initNeo4j(state.user, state.password);
  } catch (e) {
    console.log('connectivity check failed', e);
    state.errorText = `Error connecting to the GovGraph.<br/></br/>
Possible causes:<br/>
<br/>
- You're not on the VPN<br/>
- The GovGraph only runs on weekdays from 9am to 7pm<br/><br/>
Otherwise there's probably a problem. Please contact the Data Products team.`;
    resetSearch();
    return;
  }

  console.log('initok', state.neo4jSession);

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
