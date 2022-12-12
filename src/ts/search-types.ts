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
  caseSensitive: boolean, // case sensitive keyword search?
  nbResultsLimit: number // max number of results to return
}
