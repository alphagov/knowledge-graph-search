// Import the express in typescript file
import express from 'express';
import { getTaxonInfo, sendOldSkoolCypherQuery, sendCypherSearchQuery, sendCypherInitQuery } from './db-proxy';
import { SearchArea, Combinator, SearchType, SearchParams } from './src/ts/search-types';

// Initialize the express engine
const app: express.Application = express();

// Take a port 3000 for running server.
const port: number = 3000;

app.use(express.static('public'));
app.use(express.json());


// the front-end will call this upon starting to get some data needed from the server
app.get('/get-init-data', async (req, res) => {
  console.log('/get-init-data');
  try {
    res.send(await sendCypherInitQuery());
  } catch (e) {
    console.log('/get-init-data fail:', JSON.stringify(e));
    res.status(500).send(`/get-init-data fail: ${JSON.stringify(e, null, 2)}`);
  }
});

// ===== SHOULD BE REMOVED ONCE ALL ENDPOINTS ARE DONE =====
app.post('/neo4j', async (req, res) => {
  try {
    res.send(await sendOldSkoolCypherQuery(req.body));
  } catch (e) {
    console.log('neo4j proxy fail:', JSON.stringify(e));
    res.status(500).send(`neo4j proxy fail: ${e}`);
  }
});
// ========================================================

app.get('/search', async (req: any, res) => {
  console.log('API call to /search', req.query);
  // retrieve qsp params
  const params: SearchParams = {
    searchType: req.query['search-type'] || SearchType.Keyword,
    selectedWords: req.query['selected-words'] || '',
    excludedWords: req.query['excluded-words'] || '',
    selectedTaxon: req.query['selected-taxon'] || '',
    selectedLocale: req.query['lang'] || '',
    caseSensitive: req.query['case-sensitive'] || false,
    combinator: req.query['combinator'] || Combinator.Any,
    whereToSearch: {
      title: !(req.query['search-in-title'] === 'false'),
      text: !(req.query['search-in-text'] === 'false')
    },
    areaToSearch: req.query['area'] || SearchArea.Any,
    linkSearchUrl: req.query['link-search-url'] || ''
  };
  try {
    const data = await sendCypherSearchQuery(params);
    console.log('/search returns', data);
    res.send(data);
  } catch (e) {
    console.log('/search fail');
    res.status(500).send(`/search fail: ${JSON.stringify(e, null, 2)}`);
  }
});


app.get('/taxon', async (req: any, res) => {
  console.log('API call to /taxon', req.query);
  try {
    const data = await getTaxonInfo(req.query['name']);
    console.log('/taxon returns', data);
    res.send(data);
  } catch (e) {
    console.log('/taxon fail');
    res.status(500).send(`/taxon fail: ${JSON.stringify(e, null, 2)}`);
  }
});




// Server setup
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
