import { SearchResults } from '../../common/types/search-api-types'

export enum EventType {
  Dom,
  SearchRunning,
  SearchApiCallbackOk,
  SearchApiCallbackFail,
}
export interface AppEvent {
  type: EventType
  id?: string
  results?: SearchResults
  error?: string
}
export interface SearchApiCallback {
  (event: AppEvent): Promise<void>
}
