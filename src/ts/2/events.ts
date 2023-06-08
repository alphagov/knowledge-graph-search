import { state, searchState, resetSearch } from './state';
import { id, getFormInputValue, getFormSelectValue, getSortingSelectValue } from './utils';
import { view } from './view/view';
import { queryBackend } from './search-api';
import { EventType, SearchApiCallback } from './event-types';
import { SearchType, SearchArea, Combinator, WhereToSearch, Sorting, Pages } from './search-api-types';
import { languageCode } from './lang'

declare const window: any;

const handleEvent: SearchApiCallback = async function(event) {
  let fieldClicked: RegExpMatchArray | null;
  //console.log('handleEvent:', event.type, event.id || '')
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
          state.searchParams.selectedOrganisation = getFormInputValue('organisation');
          state.searchParams.selectedLocale = getFormInputValue('locale');
          //state.searchParams.sorting = <Sorting>(getFormSelectValue('sorting'));
          //state.searchParams.sorting = <Sorting>(getSortingSelectValue('sorting'));

          if ((<HTMLInputElement>id('pages-withdrawn'))?.checked) state.searchParams.pages = Pages.Withdrawn;
          if ((<HTMLInputElement>id('pages-notWithdrawn'))?.checked) state.searchParams.pages = Pages.NotWithdrawn;
          if ((<HTMLInputElement>id('pages-all'))?.checked) state.searchParams.pages = Pages.All;

          if ((<HTMLInputElement>id('where-to-search-all'))?.checked) state.searchParams.whereToSearch = WhereToSearch.All;
          if ((<HTMLInputElement>id('where-to-search-title'))?.checked) state.searchParams.whereToSearch = WhereToSearch.Title;
          if ((<HTMLInputElement>id('where-to-search-text'))?.checked) state.searchParams.whereToSearch = WhereToSearch.Text;

          state.searchParams.caseSensitive = (<HTMLInputElement>id('case-sensitive'))?.checked;
          state.searchParams.linkSearchUrl = getFormInputValue('link-search');
          state.skip = 0; // reset to first page
          if ((<HTMLInputElement>id('area-publisher'))?.checked) state.searchParams.areaToSearch = SearchArea.Publisher;
          if ((<HTMLInputElement>id('area-whitehall'))?.checked) state.searchParams.areaToSearch = SearchArea.Whitehall;
          if ((<HTMLInputElement>id('area-any'))?.checked) state.searchParams.areaToSearch = SearchArea.Any;

          if ((<HTMLInputElement>id('combinator-any'))?.checked) {
            state.searchParams.combinator = Combinator.Any;
            state.searchParams.searchType = SearchType.Keyword;
          }
          if ((<HTMLInputElement>id('combinator-all'))?.checked) {
            state.searchParams.combinator = Combinator.All;
            state.searchParams.searchType = SearchType.Keyword;
          }
          if ((<HTMLInputElement>id('combinator-notset'))?.checked) {
            state.searchParams.combinator = Combinator.NotSet;
            state.searchParams.linkSearchUrl = getFormInputValue('keyword');
            state.searchParams.selectedWords = '';
            state.searchParams.searchType = SearchType.Link;
          }

          if(state.searchParams.selectedOrganisation === 'undefined' || state.searchParams.selectedOrganisation === 'All publishing organisations') state.searchParams.selectedOrganisation = '';
          if(state.searchParams.selectedTaxon === 'undefined' || state.searchParams.selectedTaxon === 'All taxons') state.searchParams.selectedTaxon = '';
          if(state.searchParams.selectedLocale === 'undefined' || state.searchParams.selectedLocale === 'All languages') state.searchParams.selectedLocale = '';

          state.searchResults = null;
          searchButtonClicked();
          break;
        case 'button-next-page':
          state.skip = state.skip + state.resultsPerPage;
          break;
        case 'button-prev-page':
          state.skip = Math.max(state.skip - state.resultsPerPage, 0);
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
        case 'search-organisation':
          resetSearch();
          state.searchParams.searchType = SearchType.Organisation;
          break;
        case 'search-language':
          resetSearch();
          state.searchParams.searchType = SearchType.Language;
          break;
        case 'search-advanced':
          resetSearch();
          state.searchParams.searchType = SearchType.Advanced;
          break;
        case 'sorting':
          state.skip = 0;// reset to first page
          state.searchParams.sorting = <Sorting>(getFormSelectValue('sorting'));
        break;
        case 'sort-page_views':
          state.skip = 0;
          state.searchParams.sorting === Sorting.PageViewsDesc ? state.searchParams.sorting = Sorting.PageViewsAsc : state.searchParams.sorting = Sorting.PageViewsDesc;
        break;
        case 'sort-public_updated_at':
          state.skip = 0;
          state.searchParams.sorting === Sorting.UpdatedDesc ? state.searchParams.sorting = Sorting.UpdatedAsc : state.searchParams.sorting = Sorting.UpdatedDesc;
        break;
        case 'sort-first_published_at':
          state.skip = 0;
          state.searchParams.sorting === Sorting.PublishedDesc ? state.searchParams.sorting = Sorting.PublishedAsc : state.searchParams.sorting = Sorting.PublishedDesc;
        break;
        case 'sort-withdrawn_at':
          state.skip = 0;
          state.searchParams.sorting === Sorting.WithdrawnAtDesc ? state.searchParams.sorting = Sorting.WithdrawnAtAsc : state.searchParams.sorting = Sorting.WithdrawnAtDesc;
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
      //state.searchResults = event.results?.main.sort((a: any, b: any) => b.page_views - a.page_views);
      state.searchResults = event.results?.main;
      state.metaSearchResults = event.results?.meta;
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


const searchButtonClicked = async function(): Promise<void> {
  // update the state when the user clicked Search
  window.scrollTo(0, 0);
  state.systemErrorText = null;
  state.userErrors = [];
  const searchStatus = searchState();
  switch (searchStatus.code) {
    case 'ready-to-search':
      if (state.searchParams.selectedWords !== '' || state.searchParams.selectedLocale !== '' || state.searchParams.selectedTaxon !== '' || state.searchParams.selectedOrganisation !== '' || state.searchParams.linkSearchUrl !== '') {
        state.waiting = true;
        queryBackend(state.searchParams, handleEvent);
      }
      break;
    case 'specialist-publisher-search':
      state.waiting = true;
      queryBackend(state.searchParams, handleEvent);
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
    switch (state.searchParams.searchType) {
      case SearchType.Keyword:
        if (state.searchParams.selectedWords !== '')
          searchParams.set('selected-words', state.searchParams.selectedWords);
        if (state.searchParams.excludedWords !== '')
          searchParams.set('excluded-words', state.searchParams.excludedWords);
        if (state.searchParams.caseSensitive)
          searchParams.set('case-sensitive', state.searchParams.caseSensitive.toString());
        if (state.searchParams.whereToSearch)
          searchParams.set('where-to-search', state.searchParams.whereToSearch);
        if (state.searchParams.sorting)
          searchParams.set('sorting', state.searchParams.sorting);
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        if (state.searchParams.combinator !== Combinator.All)
          searchParams.set('combinator', state.searchParams.combinator);
        if (state.searchParams.pages)
          searchParams.set('pages', state.searchParams.pages);
        break;
      case SearchType.Link:
        searchParams.set('search-type', state.searchParams.searchType);
        if (state.searchParams.linkSearchUrl !== '')
          searchParams.set('link-search-url', state.searchParams.linkSearchUrl);
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        break;
      case SearchType.Taxon:
        searchParams.set('search-type', state.searchParams.searchType);
        if (state.searchParams.selectedTaxon !== '')
          searchParams.set('selected-taxon', state.searchParams.selectedTaxon);
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        break;
      case SearchType.Organisation:
        searchParams.set('search-type', state.searchParams.searchType);
        if (state.searchParams.selectedOrganisation !== '')
          searchParams.set('organisation', state.searchParams.selectedOrganisation);
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        break;
      case SearchType.Language:
        searchParams.set('search-type', state.searchParams.searchType);
        if (state.searchParams.selectedLocale !== '')
          searchParams.set('lang', languageCode(state.searchParams.selectedLocale));
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        break;
      default:
        searchParams.set('search-type', state.searchParams.searchType);
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
        if (state.searchParams.pages)
          searchParams.set('pages', state.searchParams.pages);
        if (state.searchParams.whereToSearch)
          searchParams.set('where-to-search', state.searchParams.whereToSearch);
        if (state.searchParams.sorting)
          searchParams.set('sorting', state.searchParams.sorting);
        if (state.searchParams.areaToSearch !== SearchArea.Any)
          searchParams.set('area', state.searchParams.areaToSearch);
        if (state.searchParams.combinator !== Combinator.All)
          searchParams.set('combinator', state.searchParams.combinator);
        if (state.searchParams.linkSearchUrl !== '')
          searchParams.set('link-search-url', state.searchParams.linkSearchUrl);
        break;
    }
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

const handleSorting = (a: any, b: any, sortBy: Sorting): number => {

  const distantFuture = new Date(8640000000000000).getTime();
  let dateA = a.withdrawn_at?.value ? new Date(a.withdrawn_at?.value).getTime() : distantFuture;
  let dateB = b.withdrawn_at?.value ? new Date(b.withdrawn_at?.value).getTime() : distantFuture;

  switch (sortBy) {
    case Sorting.PageViewsAsc:
      return a.page_views - b.page_views
      break;
    case Sorting.PublishedDesc:
      return new Date(b.first_published_at?.value).getTime() - new Date(a.first_published_at?.value).getTime()
      break;
    case Sorting.PublishedAsc:
      return new Date(a.first_published_at?.value).getTime() - new Date(b.first_published_at?.value).getTime()
      break;
    case Sorting.UpdatedDesc:
      return new Date(b.public_updated_at?.value).getTime() - new Date(a.public_updated_at?.value).getTime()
      break;
    case Sorting.UpdatedAsc:
      return new Date(a.public_updated_at?.value).getTime() - new Date(b.public_updated_at?.value).getTime()
      break;
    case Sorting.WithdrawnAtDesc:
      return dateB - dateA
      break;
    case Sorting.WithdrawnAtAsc:
      return dateA - dateB
      break;
    default:
      return b.page_views - a.page_views
      break;
  }
}

const getSortEventAction = (sortState: Sorting, key: string) => {
  switch (key) {
    case 'page_views':
      switch (sortState) {
        case Sorting.PageViewsDesc:
          return 'desending';
          break;
        case Sorting.PageViewsAsc:
          return 'ascending';
          break;
      }
      break;
    case 'public_updated_at':
      switch (sortState) {
        case Sorting.UpdatedDesc:
          return 'desending';
          break;
        case Sorting.UpdatedAsc:
          return 'ascending';
          break;
      }
      break;
    case 'first_published_at':
      switch (sortState) {
        case Sorting.PublishedDesc:
          return 'desending';
          break;
        case Sorting.PublishedAsc:
          return 'ascending';
          break;
      }
      break;
    case 'withdrawn_at':
      switch (sortState) {
        case Sorting.WithdrawnAtDesc:
          return 'desending';
          break;
        case Sorting.WithdrawnAtAsc:
          return 'ascending';
          break;
      }
      break;
    default:
      return '';
      break;
  }
}

export {
  handleEvent,
  searchButtonClicked,
  handleSorting,
  getSortEventAction
};
