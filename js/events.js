import { state, searchState, resetSearch } from './state.js';
import { id, getFormInputValue } from './utils.js';
import { view } from './view/view.js';
import { languageCode } from './lang.js';
import { queryGraph } from './neo4j.js';

const handleEvent = async function(event) {
  let pageDetailsMatches;
  console.log('handleEvent:', event.type, event.id || '')
  switch(event.type) {
    case 'dom':
      switch(event.id) {
      case 'search':
        // Tell GTM a search is starting
        window.dataLayer?.push({
          'event': 'formSubmission',
          'formType': 'Search',
          'formPosition': 'Page'
        });

        // Update the state
        state.selectedWords = getFormInputValue('keyword');
        state.excludedWords = getFormInputValue('excluded-keyword');
        state.selectedTaxon = getFormInputValue('taxon');
        state.selectedLocale = getFormInputValue('locale');
        state.whereToSearch.title = id('search-title')?.checked;
        state.whereToSearch.text = id('search-text')?.checked;
        console.log('sdf', state.whereToSearch)
        state.caseSensitive = id('case-sensitive')?.checked;
        state.linkSearchUrl = getFormInputValue('link-search');
        state.skip = 0; // reset to first page
        if (id('area-mainstream')?.checked) state.areaToSearch = 'mainstream';
        if (id('area-whitehall')?.checked) state.areaToSearch = 'whitehall';
        if (id('area-any')?.checked) state.areaToSearch = 'any';
        if (id('combinator-any')?.checked) state.combinator = 'any';
        if (id('combinator-all')?.checked) state.combinator = 'all';
        state.searchResults = null;
        searchButtonClicked();
        break;
      case 'button-next-page':
        state.skip = state.skip + state.resultsPerPage;
        updateUrl();
        break;
      case 'button-prev-page':
        state.skip = Math.max(state.skip - state.resultsPerPage, 0);
        updateUrl();
        break;
      case 'dismiss-feedback-banner':
        state.displayFeedbackBanner = false;
        document.cookie = 'feedback_banner_dismissed=true';
        break;
      case 'toggleDisamBox':
        state.disambBoxExpanded = !state.disambBoxExpanded;
        break;
      case 'search-keyword':
        resetSearch();
        state.searchType = 'keyword';
        break;
      case 'search-link':
        resetSearch();
        state.searchType = 'link';
        break;
      case 'search-taxon':
        resetSearch();
        state.searchType = 'taxon';
        break;
      case 'search-language':
        resetSearch();
        state.searchType = 'language';
        break;
      case 'search-mixed':
        resetSearch();
        state.searchType = 'mixed';
        break;
      case 'close-page-button':
        state.showPageWithIndex = null;
        break;
      default:
        pageDetailsMatches = event.id.match(/^page-details-(.+)$/);
        if (pageDetailsMatches) {
          state.showPageWithIndex = parseInt(pageDetailsMatches[1]);
        } else {
          console.log('unknown DOM event received:', event);
        }
      }
    break;

  // non-dom events
  case 'neo4j-running':
    state.waiting = true;
    break;
  case 'neo4j-callback-ok':
    state.searchResults = event.results.main.sort((a, b) => b.pagerank - a.pagerank);
    state.metaSearchResults = event.results.meta;
    state.waiting = false;
    state.errorText = null;
    break;
  case 'neo4j-callback-fail':
    state.searchResults = null;
    state.waiting = false;
    state.errorText = 'There was a problem querying the GovGraph. Please contact the Data Products team.';
    console.log('neo4j-callback-fail:', event.error);
    break;
  default:
    console.log('unknown event type:', event);
  }
  updateUrl();
  view();

  // scroll to the top of the page when paginating
  if (event.id === 'button-next-page' || event.id === 'button-prev-page') {
    window.scrollTo(0, 0);
  }
};


const searchButtonClicked = async function() {
  // update the state when the user clicked Search
  window.scrollTo(0, 0);
  state.errorText = null;
  state.userErrors = null;
  const searchStatus = searchState();
  switch(searchStatus.code) {
  case 'ready-to-search':
    if (state.selectedWords !== '' || state.selectedLocale !== '' || state.selectedTaxon !== '' || state.linkSearchUrl !== '') {
      state.waiting = true;
      queryGraph(state, handleEvent);
    }
    break;
  case 'error':
    state.userErrors = searchStatus.errors;
    break;
  case 'waiting':
  case 'initial':
  case 'no-results':
  case 'results':
    break;
  default:
    console.log('unknown value for searchState', searchState());
    break;
  }
};



const updateUrl = function() {
  if ('URLSearchParams' in window) {
    var searchParams = new URLSearchParams();

    if (state.searchType !== '') searchParams.set('search-type', state.searchType);
    if (state.selectedWords !== '') searchParams.set('selected-words', state.selectedWords);
    if (state.excludedWords !== '') searchParams.set('excluded-words', state.excludedWords);
    if (state.selectedTaxon !== '') searchParams.set('selected-taxon', state.selectedTaxon);
    if (state.selectedLocale !== '') searchParams.set('lang', languageCode(state.selectedLocale));
    if (state.caseSensitive) searchParams.set('case-sensitive', state.caseSensitive);
    if (state.whereToSearch.title) searchParams.set('search-in-title', 'true');
    if (state.whereToSearch.text) searchParams.set('search-in-text', 'true');
    if (state.areaToSearch.length > 0) searchParams.set('area', state.areaToSearch);
    if (state.combinator !== 'all') searchParams.set('combinator', state.combinator);
    if (state.linkSearchUrl !== '') searchParams.set('link-search-url', state.linkSearchUrl);

    let newRelativePathQuery = window.location.pathname;
    if (searchParams.toString().length > 0) {
      newRelativePathQuery += '?' + searchParams.toString();
    }
    history.pushState(null, '', newRelativePathQuery);
  }
}


export {
  handleEvent,
  searchButtonClicked
};
