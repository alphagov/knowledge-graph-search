import { SearchParams } from '../../common/types/search-api-types'

export type Field =
  | 'url'
  | 'title'
  | 'locale'
  | 'documentType'
  | 'contentId'
  | 'publishing_app'
  | 'first_published_at'
  | 'public_updated_at'
  | 'taxons'
  | 'primary_organisation'
  | 'all_organisations'
  | 'page_views'
  | 'withdrawn_at'
  | 'withdrawn_explanation'
  | 'occurrences'

export enum SortAction {
  DESC = 'desc',
  ASC = 'asc',
  NONE = '',
}

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
  pagination: {
    currentPage: number
    resultsPerPage: number
  }
  waiting: boolean
  disamboxExpanded: boolean
  showFields: any
  showFiltersPane: boolean
  showFieldSet: boolean
  documentTypes: string[]
  sorting: Partial<Record<Field, SortAction>>
}
