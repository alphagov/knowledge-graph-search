import { state, searchState, resetSearch } from './state';
import { id, getFormInputValue } from './utils';
import { view } from './view/view';
import { languageCode } from './lang';
import { queryGraph } from './neo4j';
import { EventType } from './event-types';
import { Neo4jCallback } from './neo4j-types';
import { SearchType, SearchArea, Combinator } from './state-types';


declare const window: any;

const handleEvent: Neo4jCallback = async function(event) {
  let fieldClicked: RegExpMatchArray | null;
  console.log('handleEvent:', event.type, event.id || '')
  switch (event.type) {
    case EventType.Dom:
      switch (event.id) {
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
          state.whereToSearch.title = (<HTMLInputElement>id('search-title'))?.checked;
          state.whereToSearch.text = (<HTMLInputElement>id('search-text'))?.checked;
          state.caseSensitive = (<HTMLInputElement>id('case-sensitive'))?.checked;
          state.linkSearchUrl = getFormInputValue('link-search');
          state.skip = 0; // reset to first page
          if ((<HTMLInputElement>id('area-mainstream'))?.checked) state.areaToSearch = SearchArea.Mainstream;
          if ((<HTMLInputElement>id('area-whitehall'))?.checked) state.areaToSearch = SearchArea.Whitehall;
          if ((<HTMLInputElement>id('area-any'))?.checked) state.areaToSearch = SearchArea.Any;
          if ((<HTMLInputElement>id('combinator-any'))?.checked) state.combinator = Combinator.Any;
          if ((<HTMLInputElement>id('combinator-all'))?.checked) state.combinator = Combinator.All;
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
        case 'toggleDisamBox':
          state.disamboxExpanded = !state.disamboxExpanded;
          break;
        case 'search-keyword':
          resetSearch();
          state.searchType = SearchType.Keyword;
          break;
        case 'search-link':
          resetSearch();
          state.searchType = SearchType.Link;
          break;
        case 'search-taxon':
          resetSearch();
          state.searchType = SearchType.Taxon;
          break;
        case 'search-language':
          resetSearch();
          state.searchType = SearchType.Language;
          break;
        case 'search-mixed':
          resetSearch();
          state.searchType = SearchType.Mixed;
          break;
        default:
          fieldClicked = event.id ? event.id.match(/show-field-(.*)/) : null;
          if (fieldClicked && event.id) {
            state.showFields[fieldClicked[1]] = (<HTMLInputElement>id(event.id))?.checked;
          } else {
            console.log('unknown DOM event received:', event);
          }
          console.log('unknown DOM event received:', event);
      }
      break;

    // non-dom events
    case EventType.Neo4jRunning:
      state.waiting = true;
      break;
    case EventType.Neo4jCallbackOk:
      state.searchResults = event.results?.main.sort((a: any, b: any) => b.pagerank - a.pagerank);
      state.metaSearchResults = event.results?.meta;
      state.waiting = false;
      state.systemErrorText = null;
      break;
    case EventType.Neo4jCallbackFail:
      state.searchResults = null;
      state.waiting = false;
      state.systemErrorText = 'There was a problem querying the GovGraph.';
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


const searchButtonClicked = async function(): Promise<void> {
  // update the state when the user clicked Search
  window.scrollTo(0, 0);
  state.systemErrorText = null;
  state.userErrors = [];
  const searchStatus = searchState();
  switch (searchStatus.code) {
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

    // if the state differs from the default, then set parameter

    if (state.searchType !== SearchType.Keyword) searchParams.set('search-type', state.searchType);
    if (state.selectedWords !== '') searchParams.set('selected-words', state.selectedWords);
    if (state.excludedWords !== '') searchParams.set('excluded-words', state.excludedWords);
    if (state.selectedTaxon !== '') searchParams.set('selected-taxon', state.selectedTaxon);
    if (state.selectedLocale !== '') searchParams.set('lang', languageCode(state.selectedLocale));
    if (state.caseSensitive) searchParams.set('case-sensitive', state.caseSensitive.toString());
    if (!state.whereToSearch.title) searchParams.set('search-in-title', 'false');
    if (!state.whereToSearch.text) searchParams.set('search-in-text', 'false');
    if (state.areaToSearch !== SearchArea.Any) searchParams.set('area', state.areaToSearch);
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
