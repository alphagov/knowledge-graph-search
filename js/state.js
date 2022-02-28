const state = {
  user: '',
  password: '',
  server: '',
  taxons: [], // list of names of all the taxons
  errorText: null,
  neo4jSession: null,
  combinator: 'and', // user input: whether to search all or any word
  selectedWords: '', // user input: list of words to search
  excludedWords: '', // user input: list of words to exclude
  selectedTaxon: '', // user input: the taxon to search in
  contentIds: '', // user input: the list of content ID to search for
  externalUrl: '', // user input: the external URL to search for
  linkSearchUrl: '', // user input: URL to find all pages linking to
  searchQuery: '', // generated from other user inputs or typed in directly
  searchResults: null,
  maxNumberOfResultsRequested: 100,
  showFields: {
    name: true,
    title: true,
  },
  whereToSearch: {
    title: true, // user input: whether search should include page titles
    description: false,  // user input: whether search should include page descriptions
    text: false  // user input: whether search should include page content
  },
  caseSensitive: false, // user input - whether the keyword search is case sensitive
  activeMode: 'keyword-search', // user input - type of search selected
  //  possible values: 'keyword-search', 'contentid-search', 'external-search', 'link-search', 'cypher-search'
  waiting: false // whether we're waiting for a request to return
};


const setStateFromQS = function() {
  const searchParams = new URLSearchParams(window.location.search);
  state.selectedWords = searchParams.get('selected-words') || '';
  state.excludedWords = searchParams.get('excluded-words') || '';
  state.externalUrl = searchParams.get('external-url') || '';
  state.linkSearchUrl = searchParams.get('link-search-url') || '';
  state.contentIds = searchParams.get('content-ids') || '';
  state.combinator = searchParams.get('combinator') || 'and';
  state.selectedTaxon = searchParams.get('selected-taxon') || '';
  state.caseSensitive = searchParams.get('case-sensitive') || false;
  state.activeMode = searchParams.get('active-mode') || 'keyword-search';
  state.whereToSearch.title = !(searchParams.get('search-in-title') === 'false');
  state.whereToSearch.description = searchParams.get('search-in-description') === 'true';
  state.whereToSearch.text = searchParams.get('search-in-text') === 'true';
}


export { state, setStateFromQS };
