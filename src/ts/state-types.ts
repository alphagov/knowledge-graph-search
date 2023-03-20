import { SearchParams, SearchResults } from './search-api-types';

export interface State {
  searchParams: SearchParams,
  taxons: string[],
  organisations: string[],
  locales: string[],
  systemErrorText: string | null,
  userErrors: string[],
  searchResults: SearchResults | null,
  linkResults: SearchResults | null,
  skip: number,
  skipLinks: number,
  resultsPerPage: number,
  showFields: any,
  showFieldsLinks: any,
  waiting: boolean,
  selectedTabId: string
}
