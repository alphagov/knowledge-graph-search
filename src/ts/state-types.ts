import { SearchParams, SearchResults } from './search-api-types';

export interface State {
  searchParams: SearchParams,
  taxons: string[],
  organisations: string[],
  locales: string[],
  systemErrorText: string | null,
  userErrors: string[],
  searchResults: SearchResults | null,
  skip: number,
  resultsPerPage: number,
  showFields: any,
  waiting: boolean,
  selectedTabId: string
}
