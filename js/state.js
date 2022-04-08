const state = {
  user: '',
  password: '',
  server: '',
  taxons: [], // list of names of all the taxons
  locales: [], // all the languages found in the content store
  errorText: null,
  neo4jSession: null,
  nbResultsLimit: 10000, // limit queries to this number of results
  selectedWords: '', // user input: list of words to search
  excludedWords: '', // user input: list of words to exclude
  selectedTaxon: '', // user input: the taxon to search in
  selectedLocale: '', // user input: the language to search
  linkSearchUrl: '', // user input: URL to find all pages linking to
  searchQuery: '', // generated from other user inputs or typed in directly
  searchResults: null,
  skip: 0, // where to start the pagination (number of results)
  resultsPerPage: 10, // number of results per page
  showFields: { // what result fields to show by default
    url: true,
    title: true,
  },
  whereToSearch: {
    title: true, // user input: whether search should include page titles
    text: false  // user input: whether search should include page content
  },

  //user input what broad area of the GOV.UK to search in
  areaToSearch: '', // can be "whitehall", "mainstream" or "" (meaning any)

  caseSensitive: false, // user input - whether the keyword search is case sensitive
  waiting: false // whether we're waiting for a request to return
};


const setStateFromQS = function() {
  const searchParams = new URLSearchParams(window.location.search);
  state.selectedWords = searchParams.get('selected-words') || '';
  state.excludedWords = searchParams.get('excluded-words') || '';
  state.linkSearchUrl = searchParams.get('link-search-url') || '';
  state.selectedTaxon = searchParams.get('selected-taxon') || '';
  state.selectedLocale = searchParams.get('lang') || '';
  state.caseSensitive = searchParams.get('case-sensitive') || false;
  state.whereToSearch.title = !(searchParams.get('search-in-title') === 'false');
  state.whereToSearch.text = searchParams.get('search-in-text') === 'true';
  state.areaToSearch = searchParams.get('area') || '';
  state.skip = parseInt(searchParams.get('skip')) || 0;
}


export { state, setStateFromQS };
