export enum SearchType {
  Keyword = 'keyword',
  Link = 'link',
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

export enum SearchArea {
  Any = 'any',
  Whitehall = 'whitehall',
  Publisher = 'publisher',
}

export type SearchParams = {
  searchType: SearchType
  selectedWords: string // list of words to search
  excludedWords: string // list of words to exclude
  selectedTaxon: string // taxon to search in
  selectedOrganisation: string // organisation to search in
  selectedLocale: string // the language to search for
  linkSearchUrl: string // URL to find all pages linking to
  whereToSearch: {
    title: boolean
    text: boolean
  } // what parts of the pages to search in
  combinator: Combinator // all keywords or any keywords
  areaToSearch: SearchArea // whitehall, publisher, both
  caseSensitive: boolean // case sensitive keyword search?
}

export enum MetaResultType {
  Person = 'Person',
  Organisation = 'Organisation',
  BankHoliday = 'BankHoliday',
  Role = 'Role',
  Taxon = 'Taxon',
  Transaction = 'Transaction',
}

export type Person = {
  type: MetaResultType
  name: string
  homepage: string
  description: string
  roles: {
    title: string
    orgs: {
      orgName: string
      orgUrl: string
    }[]
    orgName: string
    orgUrl: string
    startDate: Date
    endDate: Date | null
  }[]
}

export type Organisation = {
  type: MetaResultType
  name: string
  homepage: string
  description: string
  parentOrgNames: string[]
  childOrgNames: string[]
  personRoleNames: {
    personName: string
    roleName: string
  }[]
  supersededBy: string[]
  supersedes: string[]
}

export type Taxon = {
  type: MetaResultType
  name: string
  homepage: string
  description: string
  level: number
  ancestorTaxons: {
    url: string
    name: string
    level: number
  }[]
  childTaxons: {
    url: string
    name: string
    level: number
  }[]
}

export type Transaction = {
  type: MetaResultType
  name: string
  description: string
  homepage: string
}

export type BankHoliday = {
  type: MetaResultType
  name: string
  dates: string[]
  divisions: string[]
}

export type Role = {
  type: MetaResultType
  name: string
  description: string
  personNames: {
    name: string
    homepage: string
    startDate: Date
    endDate: Date | null
  }[]
  orgNames: string[]
}

// a neo4 search can return a variable number of records of any type
export type MainResult = unknown

export type MetaResult =
  | Person
  | Organisation
  | BankHoliday
  | Transaction
  | Role
  | Taxon

export type SearchResults = {
  main: MainResult[]
  meta: MetaResult[]
}

export type InitResults = {
  taxons: string[]
  locales: string[]
  organisations: string[]
}
