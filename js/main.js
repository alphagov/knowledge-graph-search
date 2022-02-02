/* global neo4j */

import { view } from './view.js';
import { state } from './state.js';


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
      state.errorText('Failed to retrieve credentials to connect to the Knowledge Graph');
    });

  // Initialise neo4j
  state.neo4jDriver = neo4j.driver(state.server, neo4j.auth.basic(state.user, state.password));
  state.neo4jSession = state.neo4jDriver.session({ defaultAccessMode: neo4j.session.READ });
  state.errorText = null;


  // Get the list of all the taxons
  const taxons = await state.neo4jSession.readTransaction(tx =>
    tx.run('MATCH (t:Taxon) RETURN t.name'));
  state.taxons = taxons.records.map(taxon => taxon._fields[0]).sort();
};


//==================================================
// START
//==================================================


(async () => {
  await init();
  view();
})();
