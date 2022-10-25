export enum EventType {
  Dom, Neo4jRunning, Neo4jCallbackOk, Neo4jCallbackFail
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
