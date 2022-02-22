/* global neo4j */

import { view } from './view.js';
import { state, setStateFromQS } from './state.js';


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
  state.neo4jDriver = neo4j.driver(
    state.server,
    neo4j.auth.basic(state.user, state.password),
    { maxTransactionRetryTime: 3000 }
  );

  try {
    await state.neo4jDriver.verifyConnectivity(
      { database: state.server }
    );
  } catch (e) {
    console.log('connectivity check failed', e);
    state.errorText = 'Error connecting to the GovGraph. Are you on the VPN?';
    return;
  }


  state.neo4jSession = state.neo4jDriver.session({ defaultAccessMode: neo4j.session.READ });
  state.errorText = null;

  // Get the list of all the taxons
  try {
    const taxons = await state.neo4jSession.readTransaction(tx =>
      tx.run('MATCH (t:Taxon) RETURN t.name')
    );
    state.taxons = taxons.records.map(taxon => taxon._fields[0]).sort();
  } catch (e) {
    state.errorText = 'Error retrieving taxons.';
  }

  window.addEventListener('popstate', () => {
    setStateFromQS();
    view();
  });
};


//==================================================
// START
//==================================================


(async () => {
  await init();
  setStateFromQS();
  view();
})();
