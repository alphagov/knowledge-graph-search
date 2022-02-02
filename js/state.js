const state = {
  user: '',
  password: '',
  server: '',
  taxons: [], // list of names of all the taxons
  errorText: null,
  neo4jSession: null,
  combinator: 'and', // or 'or'
  selectedWords: '',
  excludedWords: '',
  selectedTaxon: '',
  contentIds: '',
  externalUrl: '',
  linkSearchUrl: '',
  searchQuery: null,
  searchResults: null,
  maxNumberOfResultsRequested: 100,
  showFields: {
    contentId: false,
    documentType: true,
    publishingApp: true,
    firstPublished: true,
    lastUpdated: true,
    taxons: false
  },
  whereToSearch: {
    title: true,
    description: false,
    text: false
  },
  caseSensitive: false,
  activeMode: 'keyword-search',
  //  possible values: 'keyword-search', 'contentid-search', 'external-search', 'link-search'
  waiting: false // whether we're waiting for a request to return
};

export { state };
