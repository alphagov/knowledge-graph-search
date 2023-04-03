// Import the express in typescript file
const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const { ensureLoggedIn } = require('connect-ensure-login');
import express from 'express';
const bodyParser = require('body-parser');


import { sendSearchQuery, sendInitQuery, getOrganisationInfo, getPersonInfo, getRoleInfo, getTaxonInfo, getBankHolidayInfo, getTransactionInfo } from './bigquery';
import { SearchArea, Combinator, SearchType, SearchParams } from './src/ts/search-api-types';
import { csvStringify } from './csv';

// Initialize the express engine
const app: express.Application = express();

const port: number = process.env.port ? parseInt(process.env.port) : 8080;


// The OAuth code is based on multiple online sources.
// The main one is:
// https://www.pveller.com/oauth2-with-passport-10-steps-recipe/

passport.serializeUser((user:any, done:any) => done(null, user));
passport.deserializeUser((user:any, done:any) => done(null, user));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());
app.set('trust proxy', 1) // trust first proxy
app.use(passport.initialize());
app.use(passport.session());

const spoofAuth = process.env.DISABLE_AUTH;

if (spoofAuth) {
  console.log('DISABLE_AUTH was set, so authentication is disabled');
}

const oAuthClientId = process.env.OAUTH_ID || 'not set';
const oAuthClientSecret = process.env.OAUTH_SECRET || 'not set';

const authStrategy = new OAuth2Strategy(
  {
    authorizationURL: process.env.OAUTH_AUTH_URL || 'not set',
    tokenURL: process.env.OAUTH_TOKEN_URL || 'not set',
    clientID: process.env.OAUTH_ID || 'not set',
    clientSecret: process.env.OAUTH_SECRET || 'not set',
    callbackURL: process.env.OAUTH_CALLBACK_URL || 'not set'
  },
  function(accessToken: string, refreshToken: string, profile: any, cb: any) {
    console.log('OAuth2Strategy callback', accessToken, refreshToken, profile);
    cb(null, profile);
  }
);

if (spoofAuth) {
  passport.use({
    name: 'oauth2',
    authenticate: function () {
      try {
        this.success({});
      } catch (error) {
        this.error(error);
      }
    }
  });
} else {
  passport.use(authStrategy);
}

const checkLoggedIn = spoofAuth ?
  () => (_req: any, _res: any, next: any) => next() :
  ensureLoggedIn;


// Routes

app.get('/login', passport.authenticate('oauth2'));


app.get('/',
  checkLoggedIn('/login'),
  async (req, res) => res.sendFile('views/index.html', {root: __dirname })
);

app.get('/auth/gds/callback',
  passport.authenticate('oauth2', '/error-callback'),
  async (req, res) => res.redirect('/')
);


// the front-end will call this upon starting to get some data needed from the server
app.get('/get-init-data', checkLoggedIn('/'), async (req, res) => {
  console.log('/get-init-data');
  try {
    res.send(await sendInitQuery());
  } catch (e: any) {
    console.log('/get-init-data fail:', JSON.stringify(e));
    res.status(500).send(e);
  }
});


app.get('/search', checkLoggedIn('/'), async (req: any, res) => {
  console.log('API call to /search', req.query);
  // retrieve qsp params
  const params: SearchParams = {
    searchType: req.query['search-type'] || SearchType.Keyword,
    selectedWords: req.query['selected-words'] || '',
    excludedWords: req.query['excluded-words'] || '',
    selectedTaxon: req.query['selected-taxon'] || '',
    selectedOrganisation: req.query['selected-organisation'] || '',
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

app.get('/csv', async (req: any, res) => {
  console.log('API call to /csv', req.query);
  // retrieve qsp params
  const params: SearchParams = {
    searchType: req.query['search-type'] || SearchType.Keyword,
    selectedWords: req.query['selected-words'] || '',
    excludedWords: req.query['excluded-words'] || '',
    selectedTaxon: req.query['selected-taxon'] || '',
    selectedLocale: req.query['lang'] || '',
    selectedOrganisation: req.query['organisation'] || '',
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
    const csvData = csvStringify(data.main);
    res.set('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (e: any) {
    console.log('/csv fail:', JSON.stringify(e));
    res.status(500).send(e);
  }
});


app.get('/taxon', checkLoggedIn('/'), async (req: any, res) => {
  console.log('API call to /taxon', req.query);
  try {
    const data = await getTaxonInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    if (e.status === 404) {
      res.status(e.status).send(e.message);
    } else {
      res.status(500).send(e.message);
    }
  }
});


app.get('/organisation', checkLoggedIn('/'), async (req: any, res) => {
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


app.get('/role', checkLoggedIn('/'), async (req: any, res) => {
  console.log('API call to /role', req.query);
  try {
    const data = await getRoleInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    res.status(500).send(e);
  }
});


app.get('/bank-holiday', checkLoggedIn('/'), async (req: any, res) => {
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

app.get('/transaction', checkLoggedIn('/'), async (req: any, res) => {
  console.log('API call to /transaction', req.query);
  try {
    const data = await getTransactionInfo(req.query['name']);
    res.send(data);
  } catch (e: any) {
    res.status(500).send(e);
  }
});


app.get('/person', checkLoggedIn('/'), async (req: any, res) => {
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
