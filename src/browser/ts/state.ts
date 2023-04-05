import { languageName } from '../../common/lang';
import { SearchParams, Combinator, SearchArea, SearchResults } from '../../common/search-api-types';
import { State } from './state-types';


// user inputs that are used to build the query.
// (basically, everything whose value could be found in the URL)
// Separate from (but included in)  state to make
// it easier to reset to those initial
// values only while keeping the rest of the state
const initialSearchParams: SearchParams = {
  selectedWords: '',
  excludedWords: '',
  selectedTaxon: '',
  selectedOrganisation: '',
  selectedLocale: '',
  whereToSearch: {
    title: true, // whether search should include page titles
    text: true  // whether search should include page content
  },
  combinator: Combinator.All,
  areaToSearch: SearchArea.Any,
  caseSensitive: false // whether the keyword search is case sensitive
};


const state: State = {
  searchParams: JSON.parse(JSON.stringify(initialSearchParams)), // deep copy
  taxons: [], // list of names of all the taxons
  locales: [], // all the languages found in the content store
  organisations: [], // list of names of all the organisations
  systemErrorText: null,
  userErrors: [], // error codes due to user not entering valid search criteria
  searchResults: null,
  linkResults: null,
  skip: 0, // where to start the pagination for the main results tab
  skipLinks: 0, // where to start the pagination for the links tab
  resultsPerPage: 10, // number of results per page
  showFields: { // what result fields to show by default on the main results tab
    url: true,
    title: true
  },
  showFieldsLinks: { // what result fields to show by default on the links tab
    url: true,
    title: true
  },
  waiting: false, // whether we're waiting for a request to return,
  selectedTabId: "keyword-results" // which tab to show when displaying results
};


const setQueryParamsFromQS = function(): void {
  const searchParams: URLSearchParams = new URLSearchParams(window.location.search);
  const maybeReplace = (stateField: keyof SearchParams, qspName: string): any =>
    searchParams.get(qspName) !== null ? searchParams.get(qspName) : initialSearchParams[stateField];

  state.searchParams.selectedWords = maybeReplace('selectedWords', 'selected-words');
  state.searchParams.excludedWords = maybeReplace('excludedWords', 'excluded-words');
  state.searchParams.selectedTaxon = maybeReplace('selectedTaxon', 'selected-taxon');
  state.searchParams.selectedOrganisation = maybeReplace('selectedOrganisation', 'selected-organisation');

  const lang: (string | null) = searchParams.get('lang');
  state.searchParams.selectedLocale = lang ? languageName(lang) : initialSearchParams.selectedLocale;
  state.searchParams.caseSensitive = maybeReplace('caseSensitive', 'case-sensitive');
  state.searchParams.areaToSearch = maybeReplace('areaToSearch', 'area');
  state.searchParams.combinator = maybeReplace('combinator', 'combinator');

  state.searchParams.whereToSearch.title = searchParams.get('search-in-title') === 'false' ?
    false : initialSearchParams.whereToSearch.title;
  state.searchParams.whereToSearch.text = searchParams.get('search-in-text') === 'false' ?
    false : initialSearchParams.whereToSearch.text;
};

const searchState = function(): { code: string, errors: string[] } {
  // Find out what to display depending on state
  // returns an object with a "code" field
  // "no-results": there was a search but no results were returned
  // "results": there was a search and there are results to display
  // "initial": there weren't any search criteria specified
  // "errors": the user didn't specify a valid query. In this case
  //   we add a "errors" field containing an array with values among:
  //   - "missingWhereToSearch": keywords were specified but not where to look for them on pages
  // "waiting": there's a query running
  const errors: string[] = [];

  if (state.waiting) return { code: 'waiting', errors };

  if (state.searchParams.selectedWords === '' && state.searchParams.excludedWords === '' && state.searchParams.selectedTaxon === '' && state.searchParams.selectedOrganisation === '' && state.searchParams.selectedLocale === '' && state.searchParams.whereToSearch.title === true && state.searchParams.whereToSearch.text === true) {
    return { code: 'initial', errors };
  }
  if (state.searchParams.selectedWords !== '') {
    if (!state.searchParams.whereToSearch.title && !state.searchParams.whereToSearch.text) {
      errors.push('missingWhereToSearch');
    }
  }
  if (errors.length > 0) return { code: 'error', errors };
  if (thereAreResults(state.searchResults)) return { code: 'results', errors };
  if (state.searchResults) return { code: 'no-results', errors };
  return { code: 'ready-to-search', errors };
};


const thereAreResults = function(results: SearchResults) {
  return results !== null && Object.keys(results).length > 0;
}


const resetSearch = function(): void {
  state.searchParams.selectedWords = '';
  state.searchParams.excludedWords = '';
  state.searchParams.selectedTaxon = '';
  state.searchParams.selectedOrganisation = '';
  state.searchParams.selectedLocale = '';
  state.searchParams.whereToSearch.title = true;
  state.searchParams.whereToSearch.text = true;
  state.searchParams.caseSensitive = false;
  state.skip = 0; // reset to first page
  state.searchParams.areaToSearch = SearchArea.Any;
  state.searchResults = null;
  state.waiting = false;
  state.searchParams.combinator = Combinator.All;
};


export { state, setQueryParamsFromQS, searchState, resetSearch, thereAreResults };
