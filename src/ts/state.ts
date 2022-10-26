import { languageName } from './lang';
import { SearchType, SearchParams, Combinator, SearchArea, State } from './state-types';


// user inputs that are used to build the query.
// (basically, everything whose value could be found in the URL)
// Separate from (but included in)  state to make
// it easier to reset to those initial
// values only while keeping the rest of the state

const initialSearchParams: SearchParams = {
  searchType: SearchType.Keyword,
  selectedWords: '',
  excludedWords: '',
  selectedTaxon: '',
  selectedLocale: '',
  linkSearchUrl: '',
  whereToSearch: {
    title: true, // whether search should include page titles
    text: true  // whether search should include page content
  },
  combinator: Combinator.Any,
  areaToSearch: SearchArea.Any,

  caseSensitive: false // whether the keyword search is case sensitive
};


const state: State = {
  ...initialSearchParams,
  taxons: [], // list of names of all the taxons
  locales: [], // all the languages found in the content store
  systemErrorText: null,
  userErrors: [], // error codes due to user not entering valid search criteria
  nbResultsLimit: 50000, // limit queries to this number of results
  searchResults: null,
  metaSearchResults: null,
  skip: 0, // where to start the pagination (number of results)
  resultsPerPage: 10, // number of results per page
  showFields: { // what result fields to show by default
    url: true,
    title: true
  },
  waiting: false, // whether we're waiting for a request to return,
  disamboxExpanded: false // if there's a resizeable disamb meta box, whether it's expanded or not
};


const setQueryParamsFromQS = function(): void {
  const searchParams: URLSearchParams = new URLSearchParams(window.location.search);

  const maybeReplace = (stateField: keyof SearchParams, qspName: string): any =>
    searchParams.get(qspName) !== null ? searchParams.get(qspName) : initialSearchParams[stateField];

  state.searchType = maybeReplace('searchType', 'search-type');
  state.selectedWords = maybeReplace('selectedWords', 'selected-words');
  state.excludedWords = maybeReplace('excludedWords', 'excluded-words');
  state.linkSearchUrl = maybeReplace('linkSearchUrl', 'link-search-url');
  state.selectedTaxon = maybeReplace('selectedTaxon', 'selected-taxon');
  const lang: (string | null) = searchParams.get('lang');
  state.selectedLocale = lang ? languageName(lang) : initialSearchParams.selectedLocale;
  state.caseSensitive = maybeReplace('caseSensitive', 'case-sensitive');
  state.areaToSearch = maybeReplace('areaToSearch', 'area');
  state.combinator = maybeReplace('combinator', 'combinator');

  state.whereToSearch.title = searchParams.get('search-in-title') === 'true' ?
    true : initialSearchParams.whereToSearch.title;
  state.whereToSearch.text = searchParams.get('search-in-text') === 'true' ?
    true : initialSearchParams.whereToSearch.text;
};

const searchState = function(): { code: string, errors: string[] } {
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
  const errors: string[] = [];


  if (state.waiting) return { code: 'waiting', errors };

  if (state.selectedWords === '' && state.excludedWords === '' && state.selectedTaxon === '' && state.selectedLocale === '' && state.linkSearchUrl === '' && state.whereToSearch.title === false && state.whereToSearch.text === false) {
    return { code: 'initial', errors };
  }

  if (state.selectedWords !== '') {
    if (!state.whereToSearch.title && !state.whereToSearch.text) {
      errors.push('missingWhereToSearch');
    }
  }
  if (errors.length > 0) return { code: 'error', errors };
  if (state.searchResults && state.searchResults.length > 0) return { code: 'results', errors };
  if (state.searchResults && state.searchResults.length === 0) return { code: 'no-results', errors };
  return { code: 'ready-to-search', errors };
};


const resetSearch = function(): void {
  state.selectedWords = '';
  state.excludedWords = '';
  state.selectedTaxon = '';
  state.selectedLocale = '';
  state.whereToSearch.title = true;
  state.whereToSearch.text = false;
  state.caseSensitive = false;
  state.linkSearchUrl = '';
  state.skip = 0; // reset to first page
  state.areaToSearch = SearchArea.Any;
  state.searchResults = null;
  state.waiting = false;
  state.combinator = Combinator.All;
};


export { state, setQueryParamsFromQS, searchState, resetSearch };
