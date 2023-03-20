import { state, searchState } from './state';
import { id, getFormInputValue } from './utils';
import { view } from './view/view';
import { queryBackend } from './search-api';
import { EventType, SearchApiCallback } from './event-types';
import { SearchArea, Combinator } from './search-api-types';
import { languageCode } from './lang'


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
          setSearchParamsFromForm();
          state.searchResults = null;
          state.selectedTabId = 'keyword-results';
          searchButtonClicked();
          break;
        case 'button-next-page':
          state.skip = state.skip + state.resultsPerPage;
          break;
        case 'button-prev-page':
          state.skip = Math.max(state.skip - state.resultsPerPage, 0);
          break;
        case 'keyword-results':
        case 'link-results':
        case 'taxon-results':
        case 'organisation-results':
        case 'person-results':
        case 'role-results':
        case 'transaction-results':
        case 'bank-holiday-results':
          state.selectedTabId = event.id;
          break;
        default:
          fieldClicked = event.id ? event.id.match(/show-field-(.*)/) : null;
          if (fieldClicked && event.id) {
            state.showFields[fieldClicked[1]] = (<HTMLInputElement>id(event.id))?.checked;
          } else {
            console.log('unknown DOM event received:', event);
          }
      }
      break;

    // non-dom events
    case EventType.SearchRunning:
      state.waiting = true;
      break;
    case EventType.SearchApiCallbackOk:
      state.searchResults = event.results;

      state.searchResults.keywords = state.searchResults.keywords.sort((a: any, b: any) => b.page_views - a.page_views);
      // we'll have to do the same for link results

      state.waiting = false;
      state.systemErrorText = null;
      break;
    case EventType.SearchApiCallbackFail:
      state.searchResults = null;
      state.waiting = false;
      state.systemErrorText = event.error;
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


const setSearchParamsFromForm = function() {
  // Update the state from the current HTML form values
  state.searchParams.selectedWords = getFormInputValue('keyword');
  state.searchParams.excludedWords = getFormInputValue('excluded-keyword');
  state.searchParams.selectedTaxon = getFormInputValue('taxon');
  state.searchParams.selectedOrganisation = getFormInputValue('organisation');
  state.searchParams.selectedLocale = getFormInputValue('locale');
  state.searchParams.whereToSearch.title = (<HTMLInputElement>id('search-title')) ?
    (<HTMLInputElement>id('search-title')).checked : true;
  state.searchParams.whereToSearch.text = (<HTMLInputElement>id('search-text')) ?
    (<HTMLInputElement>id('search-text')).checked : true;
  state.searchParams.caseSensitive = (<HTMLInputElement>id('case-sensitive'))?.checked || false;
  state.skip = 0; // reset to first page
  if ((<HTMLInputElement>id('area-publisher'))?.checked) state.searchParams.areaToSearch = SearchArea.Publisher;
  if ((<HTMLInputElement>id('area-whitehall'))?.checked) state.searchParams.areaToSearch = SearchArea.Whitehall;
  if ((<HTMLInputElement>id('area-any'))?.checked) state.searchParams.areaToSearch = SearchArea.Any;
  if ((<HTMLInputElement>id('combinator-any'))?.checked) state.searchParams.combinator = Combinator.Any;
  if ((<HTMLInputElement>id('combinator-all'))?.checked) state.searchParams.combinator = Combinator.All;
}

const searchButtonClicked = async function(): Promise<void> {
  // update the state when the user clicked Search
  window.scrollTo(0, 0);
  state.systemErrorText = null;
  state.userErrors = [];
  const searchStatus = searchState();
  console.log(1, searchStatus);

  switch (searchStatus.code) {
    case 'ready-to-search':
      if (state.searchParams.selectedWords !== '' || state.searchParams.selectedLocale !== '' || state.searchParams.selectedTaxon !== '' || state.searchParams.selectedOrganisation !== '' ) {
        state.waiting = true;
        queryBackend(state.searchParams, handleEvent);
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
    if (state.searchParams.selectedWords !== '')
      searchParams.set('selected-words', state.searchParams.selectedWords);
    if (state.searchParams.excludedWords !== '')
      searchParams.set('excluded-words', state.searchParams.excludedWords);
    if (state.searchParams.selectedTaxon !== '')
      searchParams.set('selected-taxon', state.searchParams.selectedTaxon);
    if (state.searchParams.selectedOrganisation !== '')
      searchParams.set('selected-organisation', state.searchParams.selectedOrganisation);
    if (state.searchParams.selectedLocale !== '')
      searchParams.set('lang', languageCode(state.searchParams.selectedLocale));
    if (state.searchParams.caseSensitive)
      searchParams.set('case-sensitive', state.searchParams.caseSensitive.toString());
    if (!state.searchParams.whereToSearch.title)
      searchParams.set('search-in-title', 'false');
    if (!state.searchParams.whereToSearch.text)
      searchParams.set('search-in-text', 'false');
    if (state.searchParams.areaToSearch !== SearchArea.Any)
      searchParams.set('area', state.searchParams.areaToSearch);
    if (state.searchParams.combinator !== Combinator.All)
      searchParams.set('combinator', state.searchParams.combinator);
    const newQueryString = searchParams.toString();
    const oldQueryString = location.search.slice(1);
    if (newQueryString !== oldQueryString) {
      let newRelativePathQuery = window.location.pathname;
      if (newQueryString.length > 0) {
        newRelativePathQuery += '?' + searchParams.toString();
      }
      history.pushState(null, '', newRelativePathQuery);
    }
  }
};


export {
  handleEvent,
  searchButtonClicked
};
