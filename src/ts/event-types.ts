export interface SearchApiCallback {
  (event: AppEvent): Promise<void>
}


export enum EventType {
  Dom, SearchRunning, SearchApiCallbackOk, SearchApiCallbackFail
}


export interface AppEvent {
  type: EventType,
  id?: string,
  results?: {
    main: any,
    meta: any
  },
  error?: string
}
