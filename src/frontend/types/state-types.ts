import { SearchParams } from '../../common/types/search-api-types'
import { CSVDownloadType } from '../state'
import { SignonProfileData } from '../../backend/constants/types'

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
  | 'government'
  | 'is_political'
  | 'people'

export enum SortAction {
  DESC = 'desc',
  ASC = 'asc',
  NONE = '',
}

export type Sorting = Partial<
  Record<Field, { sortIndex: number; sort: SortAction }>
>

export interface State {
  searchParams: SearchParams
  taxons: string[]
  organisations: string[]
  locales: string[]
  governments: string[]
  systemErrorText: any
  userErrors: string[]
  searchResults: any[] | null
  skip: number

  pagination: {
    currentPage: number
    resultsPerPage: number
  }
  waiting: boolean
  stagedShowFields: any
  showFields: any
  showFiltersPane: boolean
  showFieldSet: boolean
  documentTypes: string[]
  sorting: Partial<Record<Field, SortAction>>
  CSVDownloadType: CSVDownloadType
  phoneNumberError: boolean | null
  signonProfileData?: SignonProfileData
  publishingApps: string[]
  persons: string[]
}
