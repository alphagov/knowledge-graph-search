import { splitKeywords } from './utils.js';
import { languageName } from './lang.js';

const initialSearchParams = { // user inputs that are used to build the query
  selectedWords: '', // list of words to search
  excludedWords: '', // list of words to exclude
  selectedTaxon: '', // the taxon to search in
  selectedLocale: '', // the language to search
  linkSearchUrl: '', // URL to find all pages linking to
  whereToSearch: {
    title: false, // whether search should include page titles
    text: false  // whether search should include page content
  },
  combinator: null, // whether the user wants all the keywords or any of them (can be 'any', 'all' or null if the user hasn't selected yet)
  // the publishing app to search in
  areaToSearch: '', // can be "whitehall", "mainstream", "any" (meaning the user hasn't chosen yet)

  caseSensitive: false // whether the keyword search is case sensitive
};


const state = {
  ...initialSearchParams,
  user: '',
  password: '',
  server: '',
  taxons: [], // list of names of all the taxons
  locales: [], // all the languages found in the content store
  errorText: null,
  userErrors: null, // error codes due to user not entering valid search criteria
  neo4jSession: null,
  nbResultsLimit: 10000, // limit queries to this number of results
  searchQuery: '', // generated from other user inputs or typed in directly
  searchResults: null,
  skip: 0, // where to start the pagination (number of results)
  resultsPerPage: 10, // number of results per page
  showFields: { // what result fields to show by default
    url: true,
    title: true
  },
  waiting: false, // whether we're waiting for a request to return,
  infoPopupHtml: null // if non-null, it should be an objct with title and body, in which case show a popup with the text and a close button`
};


const setQueryParamsFromQS = function() {
  const searchParams = new URLSearchParams(window.location.search);

  const maybeReplace = (stateField, qspName) =>
    searchParams.get(qspName) !== null ? searchParams.get(qspName) : initialSearchParams[stateField];

  state.selectedWords = maybeReplace('selectedWords', 'selected-words');
  state.excludedWords = maybeReplace('excludedWords', 'excluded-words');
  state.linkSearchUrl = maybeReplace('linkSearchUrl', 'link-search-url');
  state.selectedTaxon = maybeReplace('selectedTaxon', 'selected-taxon');
  const lang = searchParams.get('lang');
  state.selectedLocale = lang ? languageName(lang) : initialSearchParams.selectedLocale;
  state.caseSensitive = maybeReplace('caseSensitive', 'case-sensitive');
  state.areaToSearch = maybeReplace('areaToSearch', 'area');
  state.combinator = maybeReplace('combinator', 'combinator');

  state.whereToSearch.title = searchParams.get('search-in-title') !== null ? searchParams.get('search-in-title') : initialSearchParams.whereToSearch.title;
  state.whereToSearch.text = searchParams.get('search-in-text') !== null ? searchParams.get('search-in-text') : initialSearchParams.whereToSearch.text;
};

const searchState = function() {
  // Find out what to display depending on state
  // returns an object with a "code" field
  // "no-results": there was a search but no results were returned
  // "results": there was a search and there are results to display
  // "initial": there weren't any search criteria specified
  // "errors": the user didn't specify a valid query. In this case
  //   we add a "errors" fiels containing an array with values among:
  //   - "missingWhereToSearch": keywords were specified but not where to look for them on pages
  //   - "missingArea": no publishing platform was specified
  //   - "missingCombinator": no keyword combinator was specified

  // "waiting": there's a query running
  if (state.waiting) return { code: 'waiting'};

  if (state.selectedWords === '' && state.excludedWords === '' && state.selectedTaxon === '' && state.selectedLocale === '' && state.linkSearchUrl === '' && state.whereToSearch.title === false && state.whereToSearch.text === false) {
    return { code: 'initial' };
  }

  const errors = [];
  if (state.selectedWords !== '') {
    if (!state.whereToSearch.title && !state.whereToSearch.text) {
      errors.push('missingWhereToSearch');
    }
    if (splitKeywords(state.selectedWords).length > 1 && state.combinator === null) {
      errors.push('missingCombinator');
    }
  }
  if (state.areaToSearch === '') {
    errors.push('missingArea');
  }
  if (errors.length > 0) return { code: 'error', errors };
  if (state.searchResults?.records?.length > 0) return { code: 'results' };
  if (state.searchResults?.records?.length === 0) return { code: 'no-results' };
  return { code: 'ready-to-search' };
};

export { state, setQueryParamsFromQS, searchState };
