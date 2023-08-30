import { SearchParams } from '../../common/types/search-api-types'

export interface State {
  searchParams: SearchParams
  taxons: string[]
  organisations: string[]
  locales: string[]
  systemErrorText: string | null
  userErrors: string[]
  searchResults: any[] | null
  metaSearchResults: any[] | null
  skip: number
  resultsPerPage: number
  waiting: boolean
  disamboxExpanded: boolean
  showFields: any
  hideFiltersPane: boolean
}
