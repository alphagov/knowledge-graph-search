import { AppEvent } from './event-types';
import { State } from './state-types';

export interface Neo4jResponse {
  readonly results: Neo4jResponseResult[]
}

export interface Neo4jResponseResult {
  readonly columns: string[],
  readonly data: Neo4jResultData[]
}

export interface Neo4jResultData {
  readonly row: any[],
  readonly meta: any[]
}

export interface Neo4jCallbackPayload {
  readonly type: string,
  readonly results?: FullSearchResults,
  readonly error?: Error
}

export interface FullSearchResults {
  readonly main: any,
  readonly meta: any
}

export interface Neo4jQuery {
  readonly statement: string,
  readonly parameters?: Record<string, any>
}

export interface QueryGraphFn {
  (state: State, callback: Promise<void>): Promise<void>
}

export interface Neo4jCallback {
  (event: AppEvent): Promise<void>
}

export interface ResultDate {
  dateString: string
}

export interface MetaResult {
  type: string,
  name: string,
  dates?: ResultDate[],
  regions?: string[],
  homepage?: string,
  description?: string,
  parentName?: string,
  childOrgNames?: string[],
  personRoleNames?: string[],
  roles?: string[],
  orgNames?: string[],
  personNames?: string[]
}
