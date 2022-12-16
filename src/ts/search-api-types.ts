export enum SearchType {
  Keyword = 'keyword',
  Link = 'link',
  Taxon = 'taxon',
  Language = 'language',
  Mixed = 'mixed',
  Results = 'results'
};

export enum Combinator {
  Any = 'any',
  All = 'all',
  NotSet = 'notset'
}

export enum SearchArea {
  Any = 'any',
  Whitehall = 'whitehall',
  Publisher = 'publisher'
}

export type SearchParams = {
  searchType: SearchType,
  selectedWords: string, // list of words to search
  excludedWords: string, // list of words to exclude
  selectedTaxon: string, // taxon to search in
  selectedLocale: string, // the language to search for
  linkSearchUrl: string, // URL to find all pages linking to
  whereToSearch: {
    title: boolean,
    text: boolean
  }, // what parts of the pages to search in
  combinator: Combinator, // all keywords or any keywords
  areaToSearch: SearchArea, // whitehall, publisher, both
  caseSensitive: boolean // case sensitive keyword search?
}

export type MetaResult = Person | Organisation | BankHoliday | Role | Taxon

export type Person = {
  type: string,
  name: string,
  homepage: string,
  description: string,
  roles: {
    title: string,
    orgName: string,
    orgUrl: string,
    startDate: Date,
    endDate: Date | null
  }[]
}

export type Organisation = {
  type: string,
  name: string,
  homepage: string,
  description: string,
  parentName: string,
  childOrgNames: string[],
  personRoleNames: {
    personName: string,
    roleName: string
  }[]
}

export type Taxon = {
  type: string,
  name: string,
  homepage: string,
  description: string,
  ancestorTaxons: {
    url: string,
    name: string
  }[],
  childTaxons: {
    url: string,
    name: string
  }[]
}

export type Transaction = {
  type: string,
  name: string,
  description: string,
  homepage: string
}

export type BankHoliday = {
  type: string,
  name: string,
  dates: string[],
  regions: string[]
}

export type Role = {
  type: string,
  name: string,
  description: string,
  personNames: {
    name: string,
    homepage: string,
    startDate: Date,
    endDate: Date | null
  }[],
  orgNames: string[]
}

// a neo4 search can return a variable number of records of any type
export type MainResult = any;

export type SearchResults = {
  mainResults: MainResult[],
  metaResults: MetaResult[]
}

export type InitResults = {
  taxons: string[],
  locales: string[]
}
