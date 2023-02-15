// Import the express in typescript file
import express from 'express';
import { sendSearchQuery, sendInitQuery, getOrganisationInfo, getPersonInfo, getRoleInfo, getTaxonInfo, getBankHolidayInfo, getTransactionInfo } from './bigquery';
import { SearchArea, Combinator, SearchType, SearchParams } from './src/ts/search-api-types';

// Initialize the express engine
const app: express.Application = express();

const port: number = process.env.port ? parseInt(process.env.port) : 8080;

app.use(express.static('public'));
app.use(express.json());


// the front-end will call this upon starting to get some data needed from the server
app.get('/get-init-data', async (req, res) => {
  console.log('/get-init-data');
  try {
    res.send(await sendInitQuery());
  } catch (e: any) {
    console.log('/get-init-data fail:', JSON.stringify(e));
    res.status(500).send(e);
  }
});


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
    combinator: req.query['combinator'] || Combinator.All,
    whereToSearch: {
      title: !(req.query['search-in-title'] === 'false'),
      text: !(req.query['search-in-text'] === 'false')
    },
    areaToSearch: req.query['area'] || SearchArea.Any,
    linkSearchUrl: req.query['link-search-url'] || ''
  };
  try {
    const data = await sendSearchQuery(params);
    res.send(data);
  } catch (e: any) {
    console.log('/search fail:', JSON.stringify(e));
    res.status(500).send(e);
  }
});


app.get('/taxon', async (req: any, res) => {
  console.log('API call to /taxon', req.query);
  try {
    const data = await getTaxonInfo(req.query['name']);
    console.log(239, data)
    res.send(data);
  } catch (e: any) {
    if (e.status === 404) {
      res.status(e.status).send(e.message);
    } else {
      res.status(500).send(e.message);
    }
  }
});


app.get('/organisation', async (req: any, res) => {
  console.log('API call to /organisation', req.query);
  try {
    const data = await getOrganisationInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    if (e.status === 404) {
      res.status(e.status).send(e.message);
    } else {
      res.status(500).send(e.message);
    }
  }
});


app.get('/role', async (req: any, res) => {
  console.log('API call to /role', req.query);
  try {
    const data = await getRoleInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    res.status(500).send(e);
  }
});


app.get('/bank-holiday', async (req: any, res) => {
  console.log('API call to /bank-holiday', req.query);
  try {
    const data = await getBankHolidayInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    if (e.status === 404) {
      res.status(e.status).send(e.message);
    } else {
      res.status(500).send(e.message);
    }
  }
});

app.get('/transaction', async (req: any, res) => {
  console.log('API call to /transaction', req.query);
  try {
    const data = await getTransactionInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    res.status(500).send(e);
  }
});


app.get('/person', async (req: any, res) => {
  console.log('API call to /person', req.query);
  try {
    const data = await getPersonInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    res.status(500).send(e);
  }
});


// Server setup
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
