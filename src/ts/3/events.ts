import { state, searchState, resetSearch, clearFilters } from './state';
import { id, getFormInputValue, getFormSelectValue, getSortingSelectValue } from './utils';
import { view } from './view/view';
import { queryBackend } from './search-api';
import { EventType, SearchApiCallback } from './event-types';
import { SearchType, SearchArea, Combinator, WhereToSearch, Sorting, Pages } from './search-api-types';
import { languageCode } from './lang'

declare const window: any;

const handleEvent: SearchApiCallback = async function(event) {
  let fieldClicked: RegExpMatchArray | null;
  console.log('handleEvent:', event.type, event.id || '')
  switch (event.type) {
    case EventType.Dom:
      switch (event.id) {
        case 'search':
        case 'clear-filters':
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
          state.searchParams.selectedDocumentType = (getFormInputValue('documentType').charAt(0).toLowerCase() + getFormInputValue('documentType').slice(1)).replace(/ /g, '_')
          state.searchParams.selectedLocale = getFormInputValue('locale');
          //state.searchParams.sorting = <Sorting>(getFormSelectValue('sorting'));
          //state.searchParams.sorting = <Sorting>(getSortingSelectValue('sorting'));


          if (getFormSelectValue('pages') === Pages.NotWithdrawn) {
              delete state.showFields.withdrawn_at;
              delete state.showFields.withdrawn_explanation;
          }

          state.searchParams.pages = getFormSelectValue('pages') as Pages;

          state.searchParams.whereToSearch = getFormSelectValue('whereToSearch') as WhereToSearch;

          state.searchParams.caseSensitive = (<HTMLInputElement>id('case-sensitive'))?.checked;
          state.searchParams.linkSearchUrl = getFormInputValue('link-search');
          state.skip = 0; // reset to first page

          state.searchParams.areaToSearch = getFormSelectValue('searchArea').charAt(0).toLowerCase() + getFormSelectValue('searchArea').slice(1) as SearchArea

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

          if(state.searchParams.selectedOrganisation === 'undefined' || state.searchParams.selectedOrganisation === '') state.searchParams.selectedOrganisation = '';
          if(state.searchParams.selectedDocumentType === 'undefined' || state.searchParams.selectedDocumentType === '') state.searchParams.selectedDocumentType = '';
          if(state.searchParams.selectedTaxon === 'undefined' || state.searchParams.selectedTaxon === '') state.searchParams.selectedTaxon = '';
          if(state.searchParams.selectedLocale === 'undefined' || state.searchParams.selectedLocale === '') state.searchParams.selectedLocale = '';

          state.searchResults = null;

          if(event.id === 'clear-filters') clearFilters();

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
        case 'searchType':
          resetSearch();
          state.searchParams.searchType = getFormSelectValue('searchType') as SearchType;
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
        case 'sort-title':
          state.skip = 0;
          state.searchParams.sorting === Sorting.TitleDesc ? state.searchParams.sorting = Sorting.TitleAsc : state.searchParams.sorting = Sorting.TitleDesc;
        break;
        case 'sort-url':
          state.skip = 0;
          state.searchParams.sorting === Sorting.UrlDesc ? state.searchParams.sorting = Sorting.UrlAsc : state.searchParams.sorting = Sorting.UrlDesc;
        break;
        case 'sort-documentType':
          state.skip = 0;
          state.searchParams.sorting === Sorting.DocumentTypeDesc ? state.searchParams.sorting = Sorting.DocumentTypeAsc : state.searchParams.sorting = Sorting.DocumentTypeDesc;
        break;
        case 'sort-occurrences':
          state.skip = 0;
          state.searchParams.sorting === Sorting.OccurrencesDesc ? state.searchParams.sorting = Sorting.OccurrencesAsc : state.searchParams.sorting = Sorting.OccurrencesDesc;
        break;
        case 'showHeaders':
        state.showHeaders = id('show-fields')?.classList.contains('checkbox-list-hidden') ? true : false;
        sessionStorage.setItem('showHeaders', state.showHeaders.toString());
        break;
        case 'uncheck-all':
        state.showFields = {};
        break;
        case 'check-all':
        const fields = Object.keys(state.searchResults[0]).filter((k: any, i:any) => !['hyperlinks'].includes(k))
        state.showFields = fields.reduce((a, v) => ({ ...a, [v]: true}), {})
        if(getFormSelectValue('pages') === Pages.NotWithdrawn) {
          state.showFields.withdrawn_at = false
          state.showFields.withdrawn_explanation = false
        }
        break;
        case 'toggle-filters':
        state.showFilters = id('filters')?.classList.contains('hidden') ? true : false;
        sessionStorage.setItem('showFilters', state.showFilters.toString());
        break;
        case 'download':
        window.location = '/csv' + window.location.search;
        break;
        case 'resultsPerPage':
        state.resultsPerPage = Number(getFormSelectValue('resultsPerPage'))
        break;
        case 'paginationLink':
        state.skip = state.resultsPerPage * (event.element.target.innerText - 1)
        break;
        case 'newSearch':
        //window.location = '/3'
        resetSearch();
        state.searchParams.searchType = SearchType.Keyword;
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
  console.log('searchStatus.code', searchStatus)
  switch (searchStatus.code) {
    case 'ready-to-search':
      if (state.searchParams.selectedWords !== '' || state.searchParams.selectedLocale !== '' || state.searchParams.selectedTaxon !== '' || state.searchParams.selectedOrganisation !== '' || state.searchParams.selectedDocumentType !== '' || state.searchParams.linkSearchUrl !== '') {
        console.log(1)
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
    console.log(2)
    case 'results':
    console.log(3)
      break;
    default:
      console.log('unknown value for searchState', searchState());
      break;
  }
};


const updateUrl = function() {
  if ('URLSearchParams' in window) {
    var searchParams = new URLSearchParams();
    console.log('updateUrl')
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
        if (state.searchParams.selectedDocumentType)
          searchParams.set('selected-documentType', state.searchParams.selectedDocumentType);
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
        if (state.searchParams.selectedDocumentType !== '')
          searchParams.set('selected-documentType', state.searchParams.selectedDocumentType);
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

const handleSorting = (a: any, b: any, sortBy: Sorting): any => {

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
    case Sorting.TitleDesc:
      return  b.title.localeCompare(a.title)
      break;
    case Sorting.TitleAsc:
      return  a.title.localeCompare(b.title)
      break;
    case Sorting.UrlDesc:
      return  b.url.localeCompare(a.url)
      break;
    case Sorting.UrlAsc:
      return  a.url.localeCompare(b.url)
      break;
    case Sorting.DocumentTypeDesc:
      return  b.documentType.localeCompare(a.documentType)
      break;
    case Sorting.DocumentTypeAsc:
      return  a.documentType.localeCompare(b.documentType)
      break;
    case Sorting.OccurrencesAsc:
      return  Object.values(a.occurrences).length ? Number(Object.values(a.occurrences).reduce((partialSum: any, x: any) => partialSum + x, 0)) - Number(Object.values(b.occurrences).reduce((partialSum: any, x: any) => partialSum + x, 0)) : a.occurrences - b.occurrences
      break;
    case Sorting.OccurrencesDesc:
      return Object.values(a.occurrences).length ? Number(Object.values(b.occurrences).reduce((partialSum: any, x: any) => partialSum + x, 0)) - Number(Object.values(a.occurrences).reduce((partialSum: any, x: any) => partialSum + x, 0)) : b.occurrences - a.occurrences
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
        default:
          return '';
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
        default:
          return '';
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
        default:
          return '';
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
        default:
          return '';
      }
      break;
      case 'title':
        switch (sortState) {
          case Sorting.TitleDesc:
            return 'desending';
            break;
          case Sorting.TitleAsc:
            return 'ascending';
            break;
          default:
            return '';
        }
        break;
      case 'url':
        switch (sortState) {
          case Sorting.UrlDesc:
            return 'desending';
            break;
          case Sorting.UrlAsc:
            return 'ascending';
            break;
          default:
            return '';
        }
        break;
      case 'documentType':
        switch (sortState) {
          case Sorting.DocumentTypeDesc:
            return 'desending';
            break;
          case Sorting.DocumentTypeAsc:
            return 'ascending';
            break;
          default:
            return '';
        }
        break;
      case 'occurrences':
        switch (sortState) {
          case Sorting.OccurrencesDesc:
            return 'desending';
            break;
          case Sorting.OccurrencesAsc:
            return 'ascending';
            break;
          default:
            return '';
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
