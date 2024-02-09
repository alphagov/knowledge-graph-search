export enum UrlParams {
  Combinator = 'combinator',
  SearchType = 'search-type',
  SelectedWords = 'selected-words',
  ExcludedWords = 'excluded-words',
  Taxon = 'taxon',
  PublishingOrganisation = 'publishing-organisation',
  CaseSensitive = 'case-sensitive',
  DocumentType = 'document-type',
  KeywordLocation = 'keyword-location',
  LinkSearchUrl = 'link-search-url',
  PhoneNumber = 'phone-number',
  PublishingApplication = 'publishing-application',
  PublishingStatus = 'publishing-status',
  Language = 'language',
}

export enum SearchType {
  Keyword = 'keyword',
  Link = 'link',
  PhoneNumber = 'phone-number',
  Organisation = 'organisation',
  Taxon = 'taxon',
  Language = 'language',
  Advanced = 'advanced',
  Results = 'results',
}

export enum Combinator {
  Any = 'any',
  All = 'all',
  NotSet = 'notset',
}

export enum KeywordLocation {
  All = 'all',
  Title = 'title',
  Description = 'description',
  BodyContent = 'bodycontent',
}

export enum PublishingStatus {
  Withdrawn = 'withdrawn',
  NotWithdrawn = 'notWithdrawn',
  All = 'all',
}

export enum PublishingApplication {
  Any = 'any',
  Whitehall = 'whitehall',
  Publisher = 'publisher',
}

export type SearchParams = {
  searchType: SearchType
  selectedWords: string // list of words to search
  excludedWords: string // list of words to exclude
  taxon: string // taxon to search in
  publishingOrganisation: string // organisation to search in
  language: string // the language to search for
  documentType: string // documentTypeto search in
  linkSearchUrl: string // URL to find all pages linking to
  phoneNumber: string // the phone number to search for
  keywordLocation: KeywordLocation // what parts of the pages to search in
  combinator: Combinator // all keywords or any keywords
  publishingApplication: PublishingApplication // whitehall, publisher, both
  caseSensitive: boolean // case sensitive keyword search?
  publishingStatus: PublishingStatus // Withdrawn, not withdrawn etc.
}

// a search can return a variable number of records of any type
export type SearchResults = unknown[]

export type InitResults = {
  taxons: string[]
  locales: string[]
  organisations: string[]
  documentTypes: string[]
}

export type Occurrence = {
  keyword: string[]
  occurrences: number[]
}
