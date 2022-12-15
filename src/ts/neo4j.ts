//==================================================
// Cypher query methods
//==================================================

import { languageCode } from './lang';
import { splitKeywords, makeQueryString } from './search-utils';
import { Neo4jResponse, Neo4jResultData, Neo4jCallback, MetaResult, Neo4jResponseResult } from './neo4j-types';
import { EventType } from './event-types';
import { SearchParams } from './search-types';

//=========== public methods ===========

const initNeo4j = async function() {
  console.log('retrieving taxons and locales');
  const apiResponse = await fetchWithTimeout('/get-init-data');
  if (apiResponse.taxons.length === 0 || apiResponse.locales.length === 3) {
    throw 'Received no data from GovGraph. It might still be loading.';
  }
  return apiResponse;
};


const queryGraph: (searchParams: SearchParams, callback: Neo4jCallback) => Promise<void> = async function(searchParams, callback) {
  callback({ type: EventType.Neo4jRunning });
  const url = `/search?${makeQueryString(searchParams)}`;
  fetchWithTimeout(url, 300)
    .then(async json => {
      const mainResults: any[] = formattedSearchResults(json.results[0]);
      let metaResults: any[] = json.results[1]?.data.length > 0 ?
        formattedSearchResults(json.results[1]) :
        [];

      // If there's an exact match, just keep it
      const searchKeywords: string = searchParams.selectedWords.replace(/"/g, '');
      const exactMetaResults = metaResults.filter((result: any) => {
        return result.node.name.toLowerCase() === searchKeywords.toLowerCase()
      });

      if (exactMetaResults.length === 1) {
        metaResults = exactMetaResults;
      }

      if (metaResults.length === 1) {
        // one meta result: show the knowledge panel (may require more neo4j queries)
        const fullMetaResults = await buildMetaboxInfo(metaResults[0]);
        callback({ type: EventType.Neo4jCallbackOk, results: { main: mainResults, meta: [fullMetaResults] } });
      } else if (metaResults.length >= 1) {
        // multiple meta results: we'll show a disambiguation page
        callback({ type: EventType.Neo4jCallbackOk, results: { main: mainResults, meta: metaResults } });
      } else {
        // no meta results
        callback({ type: EventType.Neo4jCallbackOk, results: { main: mainResults, meta: null } });
      }
    })
    .catch(error => {
      console.log('error running main+meta queries', error);
      callback({ type: EventType.Neo4jCallbackFail, error })
    });
};

//=========== private ===========

const buildMetaboxInfo = async function(info: any) {
  console.log(`Found a ${info.nodeType[0]}. Running extra queries`);
  const result: MetaResult = { type: info.nodeType[0], name: info.node.name };
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
  console.log('result', result);
  return result;
};


const mainCypherQuery = function(searchParams: any): string {
  const fieldsToSearch: string[] = [];
  const keywords = splitKeywords(searchParams.selectedWords);
  const excludedKeywords = splitKeywords(searchParams.excludedWords);
  const combinator = searchParams.eitherOr === 'any' ? 'OR' : 'AND';
  if (searchParams.whereToSearch.title) fieldsToSearch.push('title');
  if (searchParams.whereToSearch.text) fieldsToSearch.push('text', 'description');
  let inclusionClause = '';
  if (keywords.length > 0) {
    inclusionClause = 'WITH *\nWHERE ' +
      keywords
        .map(word => multiContainsClause(fieldsToSearch, word, searchParams.caseSensitive))
        .join(`\n ${combinator} `);
  }

  const exclusionClause = excludedKeywords.length ?
    ('WITH * WHERE NOT ' + excludedKeywords.map(word => multiContainsClause(fieldsToSearch, word, searchParams.caseSensitive)).join(`\n OR`)) : '';

  let areaClause = '';
  if (searchParams.areaToSearch === 'publisher') {
    areaClause = 'WITH * WHERE n.publishingApp = "publisher"';
  } else if (searchParams.areaToSearch === 'whitehall') {
    areaClause = 'WITH * WHERE n.publishingApp = "whitehall"';
  }

  let localeClause = '';
  if (searchParams.selectedLocale !== '') {
    localeClause = `WITH * WHERE n.locale = "${languageCode(searchParams.selectedLocale)}"\n`
  }

  const taxonClause = searchParams.selectedTaxon ? `
    WITH n
    MATCH(n: Page) - [: IS_TAGGED_TO] -> (taxon: Taxon) - [: HAS_PARENT * 0..] -> (:Taxon { name: "${searchParams.selectedTaxon}" })` :
    `OPTIONAL MATCH(n: Page) - [: IS_TAGGED_TO] -> (taxon:Taxon)`;

  let linkClause = '';

  if (searchParams.linkSearchUrl.length > 0) {
    // We need to determine if the link is internal or external
    const internalLinkRexExp = /^((https:\/\/)?((www\.)?gov\.uk))?\//;
    if (internalLinkRexExp.test(searchParams.linkSearchUrl)) {
      linkClause = `
        WITH n, taxon
      MATCH(n: Page) - [: HYPERLINKS_TO] -> (n2:Page)
        WHERE n2.url = "https://www.gov.uk${searchParams.linkSearchUrl.replace(internalLinkRexExp, '/')}"`
    } else {
      linkClause = `
        WITH n, taxon
      MATCH(n: Page) - [: HYPERLINKS_TO] -> (e:ExternalPage)
        WHERE e.url CONTAINS "${searchParams.linkSearchUrl}"`
    }
  }

  return `
      MATCH(n: Page)
      WHERE n.documentType IS null OR NOT n.documentType IN['gone', 'redirect', 'placeholder', 'placeholder_person']
      ${inclusionClause}
      ${exclusionClause}
      ${localeClause}
      ${areaClause}
      ${taxonClause}
      ${linkClause}
      OPTIONAL MATCH(n: Page) - [r: HAS_PRIMARY_PUBLISHING_ORGANISATION] -> (o:Organisation)
      OPTIONAL MATCH(n: Page) - [: HAS_ORGANISATIONS] -> (o2:Organisation)
      ${returnClause()} `;
};


//========== Private methods ==========

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


const containsClause = function(field: string, word: string, caseSensitive: boolean) {
  return caseSensitive ?
    `(n.${field} CONTAINS "${word}")`
    :
    `(toLower(n.${field}) CONTAINS toLower("${word}"))`
    ;
}


const multiContainsClause = function(fields: string[], word: string, caseSensitive: boolean) {
  return '(' + fields
    .map(field => containsClause(field, word, caseSensitive))
    .join(' OR ') + ')'
}


const returnClause = function() {
  return `
    RETURN
    n.url as url,
    n.title AS title,
    n.documentType AS documentType,
    n.contentID AS contentID,
    n.locale AS locale,
    n.publishingApp AS publishing_app,
    n.firstPublishedAt AS first_published_at,
    n.publicUpdatedAt AS public_updated_at,
    n.withdrawnAt AS withdrawn_at,
    n.withdrawnExplanation AS withdrawn_explanation,
    n.pagerank AS pagerank,
    COLLECT(distinct taxon.name) AS taxons,
    COLLECT(distinct o.name) AS primary_organisation,
    COLLECT(distinct o2.name) AS all_organisations
    ORDER BY n.pagerank DESC
    LIMIT 50000
  `;
};


const formattedSearchResults = (neo4jResults: Neo4jResponseResult): any[] => {
  const keys = neo4jResults.columns;
  const results: any[] = [];
  neo4jResults.data.forEach(val => {
    const result: Record<string, number> = {};
    keys.forEach((key: string, i: number) => result[key] = val.row[i]);
    results.push(result);
  });
  return results;
};

export { queryGraph, initNeo4j, mainCypherQuery };
