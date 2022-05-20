import { state, searchState } from './state.js';
import { id, sanitise, splitKeywords } from './utils.js';
import { view } from './view.js';
import { languageCode } from './lang.js';
import { searchQuery, queryGraph } from './neo4j.js';

const handleEvent = async function(event) {
  let fieldClicked;
  console.log('handleEvent:', event.type, event.id || '')
  switch(event.type) {
    case 'dom':
      switch(event.id) {
      case 'search':
        state.selectedWords = sanitise(id('keyword').value);
        state.excludedWords = sanitise(id('excluded-keyword').value);
        state.selectedTaxon = sanitise(id('taxon').value);
        state.selectedLocale = sanitise(id('locale').value);
        state.whereToSearch.title = id('search-title').checked;
        state.whereToSearch.text = id('search-text').checked;
        state.caseSensitive = id('case-sensitive').checked;
        state.linkSearchUrl = sanitise(id('link-search').value);
        state.skip = 0; // reset to first page
        if (id('area-mainstream').checked) state.areaToSearch = 'mainstream';
        if (id('area-whitehall').checked) state.areaToSearch = 'whitehall';
        if (id('area-any').checked) state.areaToSearch = 'any';
        if (id('combinator-any').checked) state.combinator = 'any';
        if (id('combinator-all').checked) state.combinator = 'all';
        state.searchResults = null;
        searchButtonClicked();
        break;
      case 'clear-filters':
        state.selectedWords = '';
        state.excludedWords = '';
        state.selectedTaxon = '';
        state.selectedLocale = '';
        state.whereToSearch.title = false;
        state.whereToSearch.text = false;
        state.caseSensitive = false;
        state.linkSearchUrl = '';
        state.skip = 0; // reset to first page
        state.showFields = { url: true, title: true };
        state.areaToSearch = '';
        state.searchResults = null;
        state.searchQuery = '';
        state.waiting = false;
        state.infoPopupHtml = null;
        break;
      case 'button-next-page':
        state.skip = state.skip + state.resultsPerPage;
        updateUrl();
        break;
      case 'button-prev-page':
        state.skip = Math.max(state.skip - state.resultsPerPage, 0);
        updateUrl();
        break;
      default:
        fieldClicked = event.id.match(/show-field-(.*)/);
        if (fieldClicked) {
          state.showFields[fieldClicked[1]] = id(event.id).checked;
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
    state.searchResults = event.result;
    state.waiting = false;
    state.errorText = null;
    break;
  case 'neo4j-callback-fail':
    state.searchResults = null;
    state.waiting = false;
    state.errorText = 'There was a problem querying the GovGraph. Please contact the Data Labs.';
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
      const keywords = splitKeywords(state.selectedWords);
      const excludedKeywords = splitKeywords(state.excludedWords);
      state.searchQuery = searchQuery(state, keywords, excludedKeywords);
      state.waiting = true;
      queryGraph(state.searchQuery, handleEvent);
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

    if (state.selectedWords !== '') searchParams.set('selected-words', state.selectedWords);
    if (state.excludedWords !== '') searchParams.set('excluded-words', state.excludedWords);
    if (state.selectedTaxon !== '') searchParams.set('selected-taxon', state.selectedTaxon);
    if (state.selectedLocale !== '') searchParams.set('lang', languageCode(state.selectedLocale));
    if (state.caseSensitive) searchParams.set('case-sensitive', state.caseSensitive);
    if (state.whereToSearch.title) searchParams.set('search-in-title', 'true');
    if (state.whereToSearch.text) searchParams.set('search-in-text', 'true');
    if (state.areaToSearch.length > 0) searchParams.set('area', state.areaToSearch);
    if (state.combinator) searchParams.set('combinator', state.combinator);
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
