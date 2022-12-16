import { state, searchState, resetSearch } from './state';
import { id, getFormInputValue } from './utils';
import { view } from './view/view';
import { makeQueryString, queryGraph } from './search-api';
import { EventType, SearchApiCallback } from './event-types';
import { SearchType, SearchArea, Combinator } from './search-api-types';


declare const window: any;

const handleEvent: SearchApiCallback = async function(event) {
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
          state.searchParams.selectedWords = getFormInputValue('keyword');
          state.searchParams.excludedWords = getFormInputValue('excluded-keyword');
          state.searchParams.selectedTaxon = getFormInputValue('taxon');
          state.searchParams.selectedLocale = getFormInputValue('locale');
          state.searchParams.whereToSearch.title = (<HTMLInputElement>id('search-title'))?.checked;
          state.searchParams.whereToSearch.text = (<HTMLInputElement>id('search-text'))?.checked;
          state.searchParams.caseSensitive = (<HTMLInputElement>id('case-sensitive'))?.checked;
          state.searchParams.linkSearchUrl = getFormInputValue('link-search');
          state.skip = 0; // reset to first page
          if ((<HTMLInputElement>id('area-publisher'))?.checked) state.searchParams.areaToSearch = SearchArea.Publisher;
          if ((<HTMLInputElement>id('area-whitehall'))?.checked) state.searchParams.areaToSearch = SearchArea.Whitehall;
          if ((<HTMLInputElement>id('area-any'))?.checked) state.searchParams.areaToSearch = SearchArea.Any;
          if ((<HTMLInputElement>id('combinator-any'))?.checked) state.searchParams.combinator = Combinator.Any;
          if ((<HTMLInputElement>id('combinator-all'))?.checked) state.searchParams.combinator = Combinator.All;
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
          state.searchParams.searchType = SearchType.Keyword;
          break;
        case 'search-link':
          resetSearch();
          state.searchParams.searchType = SearchType.Link;
          break;
        case 'search-taxon':
          resetSearch();
          state.searchParams.searchType = SearchType.Taxon;
          break;
        case 'search-language':
          resetSearch();
          state.searchParams.searchType = SearchType.Language;
          break;
        case 'search-mixed':
          resetSearch();
          state.searchParams.searchType = SearchType.Mixed;
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
    case EventType.SearchRunning:
      state.waiting = true;
      break;
    case EventType.SearchApiCallbackOk:
      state.searchResults = event.results?.main.sort((a: any, b: any) => b.pagerank - a.pagerank);
      state.metaSearchResults = event.results?.meta;
      state.waiting = false;
      state.systemErrorText = null;
      break;
    case EventType.SearchApiCallbackFail:
      state.searchResults = null;
      state.waiting = false;
      state.systemErrorText = 'There was a problem querying the GovGraph.';
      console.log('search-api-callback-fail:', event.error);
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
      if (state.searchParams.selectedWords !== '' || state.searchParams.selectedLocale !== '' || state.searchParams.selectedTaxon !== '' || state.searchParams.linkSearchUrl !== '') {
        state.waiting = true;
        queryGraph(state.searchParams, handleEvent);
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
  const urlQueryString = makeQueryString(state.searchParams);

  let newRelativePathQuery = window.location.pathname;
  if (urlQueryString.length > 0) {
    newRelativePathQuery += '?' + urlQueryString;
  }
  history.pushState(null, '', newRelativePathQuery);
};


export {
  handleEvent,
  searchButtonClicked
};
