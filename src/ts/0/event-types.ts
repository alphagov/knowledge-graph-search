import { SearchResults } from './search-api-types';

export interface SearchApiCallback {
  (event: AppEvent): Promise<void>
}


export enum EventType {
  Dom, SearchRunning, SearchApiCallbackOk, SearchApiCallbackFail
}


export interface AppEvent {
  type: EventType,
  id?: string,
  results?: SearchResults,
  error?: string
}
