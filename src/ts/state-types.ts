import { SearchType, SearchParams, Combinator, SearchArea } from './search-api-types';

export interface State {
  searchParams: SearchParams,
  taxons: string[],
  locales: string[],
  systemErrorText: string | null,
  userErrors: string[],
  searchResults: any[] | null,
  metaSearchResults: any[] | null,
  skip: number,
  resultsPerPage: number,
  showFields: any,
  waiting: boolean,
  disamboxExpanded: boolean
}
