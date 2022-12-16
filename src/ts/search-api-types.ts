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

export interface SearchParams {
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


export interface ResultDate {
  dateString: string
}

export interface ResultTaxon {
  name: string,
  url: string
}

export interface ResultRole {
  title: string,
  orgName: string,
  orgUrl: string,
  startDate: Date,
  endDate: Date | null
}

export interface ResultPersonRoleName {
  personName: string,
  roleName: string
}

export interface ResultPersonName {
  name: string,
  homepage: string,
  startDate: Date,
  endDate: Date | null
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
  personRoleNames?: ResultPersonRoleName[],
  roles?: ResultRole[],
  orgNames?: string[],
  personNames?: ResultPersonName[],
  ancestorTaxons?: ResultTaxon[]
  childTaxons?: ResultTaxon[]
}
