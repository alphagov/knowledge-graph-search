import express from 'express';
const cors = require('cors');
const bodyParser = require('body-parser');

const fs = require('fs');

// these variables are used for OAuth authentication. They will only be set if
// OAuth is enabled
let OAuth2Strategy, passport, session, ensureLoggedIn;

import { sendSearchQuery, sendInitQuery, getOrganisationInfo, getPersonInfo, getRoleInfo, getTaxonInfo, getBankHolidayInfo, getTransactionInfo } from './bigquery';
import { SearchArea, Combinator, SearchType, SearchParams, WhereToSearch, Sorting, Pages } from './src/ts/search-api-types';
import { csvStringify } from './csv';
import { sanitiseInput } from './src/ts/utils';


// Initialize the express engine
const app: express.Application = express();
const port: number = process.env.port ? parseInt(process.env.port) : 8080;


if (!process.env.DISABLE_AUTH) {
  console.log('OAuth via PassportJS is enabled because DISABLE_AUTH is set')
  // The OAuth code is based on multiple online sources.
  // The main one is:
  // https://www.pveller.com/oauth2-with-passport-10-steps-recipe/
  OAuth2Strategy = require('passport-oauth2');
  passport = require('passport');
  session = require('express-session');
  ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
  passport.serializeUser((user:any, done:any) => done(null, user));
  passport.deserializeUser((user:any, done:any) => done(null, user));

  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));
} else {
  console.log('OAuth via PassportJS is disabled, since DISABLE_AUTH is set')
}

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());

if (!process.env.DISABLE_AUTH) {
  app.set('trust proxy', 1) // trust first proxy
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new OAuth2Strategy(
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
  ));
}


// since the routes below use this function, we always need to define it
// so it we're not using OAuth, we make it do nothing
// (i.e. just a middleware passthrough)


const checkLoggedIn = ensureLoggedIn ?
  ensureLoggedIn :
  ((_redirect: string) => (_req: any, _res: any, next: any) => next());


// Routes

if (!process.env.DISABLE_AUTH) {
  app.get('/login', passport.authenticate('oauth2'));
  app.get('/auth/gds/callback',
          passport.authenticate('oauth2', '/error-callback'),
          async (req, res) => res.redirect('/')
         );
}

app.get('/',
  checkLoggedIn('/login'),
  async (req, res) => res.sendFile('views/index.html', {root: __dirname })
);

const entries = {};
const fileNames = fs.readdirSync('./src/ts/').filter((a: any) => !isNaN(Number(a)));

fileNames.forEach((e: any) => {
  app.get(`/${e}`,
    checkLoggedIn('/login'),
    async (req, res) => res.sendFile(`views/${e}/index.html`, {root: __dirname })
  );
  app.get(`/${e}/landing`,
    async (req, res) => res.sendFile(`views/${e}/landing.html`, {root: __dirname })
  );
  app.get(`/${e}/signon`,
    async (req, res) => res.sendFile(`views/${e}/signon.html`, {root: __dirname })
  );
  app.get(`/${e}/signon-applications`,
    async (req, res) => res.sendFile(`views/${e}/signon-applications.html`, {root: __dirname })
  );
});


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
    searchType: <SearchType>sanitiseInput(req.query['search-type']) || SearchType.Keyword,
    selectedWords: sanitiseInput(req.query['selected-words']) || '',
    excludedWords: sanitiseInput(req.query['excluded-words']) || '',
    selectedTaxon: sanitiseInput(req.query['selected-taxon']) || '',
    selectedOrganisation: sanitiseInput(req.query['selected-organisation']) || '',
    selectedLocale: sanitiseInput(req.query['lang']) || '',
    caseSensitive: req.query['case-sensitive'] === 'true',
    combinator: <Combinator>sanitiseInput(req.query['combinator']) || Combinator.All,
    whereToSearch: <WhereToSearch>sanitiseInput(req.query['where-to-search']) || WhereToSearch.All,
    areaToSearch: <SearchArea>sanitiseInput(req.query['area']) || SearchArea.Any,
    linkSearchUrl: sanitiseInput(req.query['link-search-url']) || '',
    sorting: <Sorting>sanitiseInput(req.query['sorting']) || Sorting.PageViewsDesc,
    pages: <Pages>sanitiseInput(req.query['pages']) || Pages.All,
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
    selectedOrganisation: req.query['selected-organisation'] || '',
    selectedLocale: req.query['lang'] || '',
    caseSensitive: req.query['case-sensitive'] || false,
    combinator: req.query['combinator'] || Combinator.All,
    whereToSearch: req.query['where-to-search'] || WhereToSearch.All,
    areaToSearch: req.query['area'] || SearchArea.Any,
    linkSearchUrl: req.query['link-search-url'] || '',
    sorting: req.query['sorting'] || Sorting.PageViewsDesc,
    pages: <Pages>sanitiseInput(req.query['pages']) || Pages.All,
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
