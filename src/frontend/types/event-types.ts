import { SearchResults } from '../../common/types/search-api-types'

export enum EventType {
  Dom,
  SearchRunning,
  SearchApiCallbackOk,
  SearchApiCallbackFail,
  SearchTabClick = 'SearchTabClick',
}
export interface AppEvent {
  type: EventType
  id?: string
  results?: SearchResults
  error?: string
  preventDefault?: () => void
}
export interface SearchApiCallback {
  (event: AppEvent): Promise<void>
}
