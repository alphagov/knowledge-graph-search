import { SearchParams, SearchArea, Combinator, SearchResults } from './search-api-types';
import { languageCode } from './lang';
import { EventType, SearchApiCallback } from './event-types';


const makeQueryString = function(sp: SearchParams): string {
  const usp = new URLSearchParams();
  if (sp.selectedWords !== '') usp.set('selected-words', sp.selectedWords);
  if (sp.excludedWords !== '') usp.set('excluded-words', sp.excludedWords);
  if (sp.selectedTaxon !== '') usp.set('selected-taxon', sp.selectedTaxon);
  if (sp.selectedOrganisation !== '') usp.set('selected-organisation', sp.selectedOrganisation);
  if (sp.selectedLocale !== '') usp.set('lang', languageCode(sp.selectedLocale));
  if (sp.caseSensitive) usp.set('case-sensitive', sp.caseSensitive.toString());
  if (!sp.whereToSearch.title) usp.set('search-in-title', 'false');
  if (!sp.whereToSearch.text) usp.set('search-in-text', 'false');
  if (sp.areaToSearch !== SearchArea.Any) usp.set('area', sp.areaToSearch);
  if (sp.combinator !== Combinator.All) usp.set('combinator', sp.combinator);
  return usp.toString();
};


const fetchWithTimeout = async function(url: string, timeoutSeconds: number = 60) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  const fetchResult = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: controller.signal
  });
  const responseBody = await fetchResult.json();
  if (!fetchResult.ok) {
    if (/^timeout of \d+ms exceeded/.test(responseBody.message)) {
      throw 'TIMEOUT';
    } else {
      throw 'UNKNOWN';
    }
  } else {
    return responseBody;
  }
};


// called from browser
const queryBackend: (searchParams: SearchParams, callback: SearchApiCallback) => Promise<void> = async function(searchParams, callback) {
  callback({ type: EventType.SearchRunning });
  const url = `/search?${makeQueryString(searchParams)}`;
  searchParams.selectedWords = searchParams.selectedWords.replace(/[“”]/g,'"');
  let results: SearchResults;

  try {
    results = await fetchWithTimeout(url, 300);
  } catch (error: any) {
    console.log('error running queries', error);
    callback({ type: EventType.SearchApiCallbackFail, error })
    return;
  }
  callback({ type: EventType.SearchApiCallbackOk, results});
};


export { makeQueryString, fetchWithTimeout, queryBackend };
