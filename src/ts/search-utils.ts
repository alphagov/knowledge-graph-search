import { SearchParams, SearchType, SearchArea, Combinator } from './search-types';
import { languageCode } from './lang';

const makeQueryString = function(sp: SearchParams): string {
  const usp = new URLSearchParams();
  if (sp.searchType !== SearchType.Keyword) usp.set('search-type', sp.searchType);
  if (sp.selectedWords !== '') usp.set('selected-words', sp.selectedWords);
  if (sp.excludedWords !== '') usp.set('excluded-words', sp.excludedWords);
  if (sp.selectedTaxon !== '') usp.set('selected-taxon', sp.selectedTaxon);
  if (sp.selectedLocale !== '') usp.set('lang', languageCode(sp.selectedLocale));
  if (sp.caseSensitive) usp.set('case-sensitive', sp.caseSensitive.toString());
  if (!sp.whereToSearch.title) usp.set('search-in-title', 'false');
  if (!sp.whereToSearch.text) usp.set('search-in-text', 'false');
  if (sp.areaToSearch !== SearchArea.Any) usp.set('area', sp.areaToSearch);
  if (sp.combinator !== Combinator.Any) usp.set('combinator', sp.combinator);
  if (sp.linkSearchUrl !== '') usp.set('link-search-url', sp.linkSearchUrl);
  return usp.toString();
};


const splitKeywords = function(keywords: string): string[] {
  const wordsToIgnore = ['of', 'for', 'the'];
  const regexp = /[^\s,"]+|"([^"]*)"/gi;
  const output = [];
  let match: (RegExpExecArray | null);
  do {
    match = regexp.exec(keywords);
    if (match) {
      output.push(match[1] ? match[1] : match[0]);
    }
  } while (match);
  return output.filter(d => d.length > 0 && !wordsToIgnore.includes(d));
};


export { splitKeywords, makeQueryString };
