import { SearchParams, SearchType, SearchArea, Combinator, MetaResult } from './search-api-types';
import { languageCode } from './lang';
import { EventType, SearchApiCallback } from './event-types';


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


const fetchWithTimeout = async function(url: string, timeoutSeconds: number = 60) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  const fetchOutput = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: controller.signal
  });
  return await fetchOutput.json();
};


// called from browser
const queryGraph: (searchParams: SearchParams, callback: SearchApiCallback) => Promise<void> = async function(searchParams, callback) {
  callback({ type: EventType.SearchRunning });
  const url = `/search?${makeQueryString(searchParams)}`;
  let apiResults;
  try {
    apiResults = await fetchWithTimeout(url, 300);
  } catch (error: any) {
    console.log('error running main+meta queries', error);
    callback({ type: EventType.SearchApiCallbackFail, error })
  }

  let { mainResults, metaResults } = apiResults;

  // If there's an exact match within the meta results, just keep that one
  const searchKeywords: string = searchParams.selectedWords.replace(/"/g, '');
  const exactMetaResults = metaResults.filter((result: any) => {
    return result.node.name.toLowerCase() === searchKeywords.toLowerCase()
  });
  if (exactMetaResults.length === 1) {
    metaResults = exactMetaResults;
  }

  if (metaResults.length === 1) {
    // one meta result: show the knowledge panel (may require more API queries)
    const fullMetaResults = await buildMetaboxInfo(metaResults[0]);
    callback({ type: EventType.SearchApiCallbackOk, results: { main: mainResults, meta: [fullMetaResults] } });
  } else if (metaResults.length >= 1) {
    // multiple meta results: we'll show a disambiguation page
    callback({ type: EventType.SearchApiCallbackOk, results: { main: mainResults, meta: metaResults } });
  } else {
    // no meta results
    callback({ type: EventType.SearchApiCallbackOk, results: { main: mainResults, meta: null } });
  }
};

//=========== private ===========

const buildMetaboxInfo = async function(info: any) {
  console.log(`Found a ${info.nodeType[0]}. Running extra queries`);
  switch (info.nodeType[0]) {
    case 'BankHoliday': {
      return await fetchWithTimeout(`/bank-holiday?name=${encodeURIComponent(info.node.name)}`);
    }
    case 'Person': {
      return await fetchWithTimeout(`/person?name=${encodeURIComponent(info.node.name)}`);
    }
    case 'Role': {
      return await fetchWithTimeout(`/role?name=${encodeURIComponent(info.node.name)}`);
    }
    case 'Organisation': {
      return await fetchWithTimeout(`/organisation?name=${encodeURIComponent(info.node.name)}`);
    }
    case 'Transaction': {
      return {
        homepage: info.homepage.url,
        description: info.node.description
      }
    }
    case 'Taxon': {
      return await fetchWithTimeout(`/taxon?name=${encodeURIComponent(info.node.name)}`);
    }
    default:
      console.log('unknown meta node type', info.nodeType[0]);
  }
};


export { makeQueryString, fetchWithTimeout, queryGraph };
