// Import the express in typescript file
import express from 'express';
import { sendOldSkoolCypherQuery, sendCypherSearchQuery, sendCypherInitQuery } from './db-proxy';
import { SearchArea, Combinator, SearchType, SearchParams } from './search-types';

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

app.post('/neo4j', async (req, res) => {
  try {
    console.log(1);
    res.send(await sendOldSkoolCypherQuery(req.body));
  } catch (e) {
    console.log('neo4j proxy fail:', JSON.stringify(e));
    res.status(500).send(`neo4j proxy fail: ${e}`);
  }
});

/*
app.get('/neo4j', async (req: any, res) => {
  // retrieve qsp params
  const params: SearchParams = {
    searchType: req.params['search-type'] || SearchType.Keyword,
    selectedWords: req.params['selected-words'] || '',
    excludedWords: req.params['excluded-words'] || '',
    selectedTaxon: req.params['selected-taxon'] || '',
    selectedLocale: req.params['lang'] || '',
    caseSensitive: req.params['case-sensitive'] || false,
    combinator: req.params['combinator'] || Combinator.Any,
    whereToSearch: {
      title: req.params['search-in-title'] || true,
      text: req.params['search-in-text'] || true
    },
    areaToSearch: req.params['area'] || SearchArea.Any,
    linkSearchUrl: req.params['link-search-url'] || ''
  };

  try {
    const data = await sendCypherSearchQuery(params);
    res.send(data);
  } catch (e) {
    res.status(500).send(`neo4j proxy fail: ${JSON.stringify(e, null, 2)}`);
  }
});



// Server setup
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
