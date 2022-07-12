/* global neo4j */

import { view } from './view/view.js';
import { state, setQueryParamsFromQS } from './state.js';
import { searchButtonClicked } from './events.js';



//==================================================
// INIT
//==================================================

const init = async function() {
  // First, look if there's a file with authentication params
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

  // Initialise neo4j
  console.log('starting neo4j driver');
  state.neo4jDriver = neo4j.driver(
    state.server,
    neo4j.auth.basic(state.user, state.password),
    { // see https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-configuration
      connectionTimeout: 5000
    }
  );

  try {
    await state.neo4jDriver.verifyConnectivity(
      { database: state.server }
    );
  } catch (e) {
    console.log('connectivity check failed', e);
    state.errorText = `Error connecting to the GovGraph.<br/>
Possible causes:<br/>
- You''re not on the VPN<br/>
- The GovGraph only runs on weekdays from 9 to 7<br/>
Otherwise there's probably a problem. Please contact the Data Products team.`;
    return;
  }

  console.log('starting neo4j session');
  state.neo4jSession = state.neo4jDriver.session({ defaultAccessMode: neo4j.session.READ });
  state.errorText = null;

  // if page is unloaded then close the neo4j connection
  window.addEventListener('beforeunload', async () => {
    console.log('closing session and driver');
    await state.neo4jSession.close();
    await state.neo4jDriver.close();
  });

  // Get the list of all the taxons
  try {
    const taxons = await state.neo4jSession.readTransaction(tx =>
      tx.run('MATCH (t:Taxon) RETURN t.name')
    );
    state.taxons = taxons.records.map(taxon => taxon._fields[0]).sort();
  } catch (e) {
    state.errorText = 'Error retrieving taxons.';
  }

  // get the list of all locales
  try {
    const locales = await state.neo4jSession.readTransaction(tx =>
      tx.run('MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale')
    );
    state.locales = locales.records.map(locale => locale._fields[0]).sort();
    state.locales = ['', 'en', 'cy'].concat(state.locales);
  } catch (e) {
    state.errorText = 'Error retrieving locales.';
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
  setQueryParamsFromQS();
  searchButtonClicked();
  view();
})();
