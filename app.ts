import express from 'express';
const cors = require('cors');
const bodyParser = require('body-parser');

// these variables are used for OAuth authentication. They will only be set if
// OAuth is enabled
let OAuth2Strategy, passport, session, ensureLoggedIn;

import { sendSearchQuery, sendInitQuery } from './bigquery';
import { SearchArea, Combinator, SearchParams } from './src/ts/search-api-types';
import { csvStringify } from './csv';


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
    const csvData = csvStringify(data.main);
    res.set('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (e: any) {
    console.log('/csv fail:', JSON.stringify(e));
    res.status(500).send(e);
  }
});


// Server setup
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
