//==================================================
// Cypher query methods
//==================================================

import { languageCode } from './lang';
import { splitKeywords, makeQueryString } from './search-utils';
import { Neo4jResponse, Neo4jResultData, Neo4jCallback, Neo4jQuery, MetaResult, Neo4jResponseResult } from './neo4j-types';
import { EventType } from './event-types';
import { SearchParams } from './search-types';

//=========== public methods ===========

const initNeo4j = async function() {
  console.log('retrieving taxons and locales');
  const neo4jResponse: Response = await fetch('/get-init-data');
  if (!neo4jResponse.ok) {
    throw 'Failed to connect to GovGraph';
  }
  let json: Neo4jResponse;
  try {
    json = await neo4jResponse.json();
    console.log('neo4Response', json);

  } catch (error) {
    console.log('Got an invalid json answer from Neo4j', JSON.stringify(error));
    throw 'Received invalid data from GovGraph';
  }
  if (json.results[0].data.length === 0 || json.results[1].data.length === 0) {
    console.log('Retrieved no taxons or no locales');
    return { taxons: [], locales: [] };
    throw 'Received no data from GovGraph. It might still be loading.';
  } else {
    console.log(`successfully fetched taxons and locales`);
    return {
      taxons: json.results[0].data.map((d: Neo4jResultData) => d.row[0]).sort(),
      locales: ['', 'en', 'cy'].concat(json.results[1].data.map((d: Neo4jResultData) => d.row[0]).sort())
    }
  }
};


const queryGraph: (searchParams: SearchParams, callback: Neo4jCallback) => Promise<void> = async function(searchParams, callback) {
  callback({ type: EventType.Neo4jRunning });
  const url = `/search?${makeQueryString(searchParams)}`;
  fetchWithTimeout(url, 300)
    .then(response => response.json())
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
    // We found a bank holiday, so we need to run 2 further queries
    // one to get the dates, the other to get the regions
    case 'BankHoliday': {
      const usp = new URLSearchParams();
      usp.set('name', info.node.name);
      const response: Response = await fetchWithTimeout(`/bank-holiday?${usp}`);
      const bankHolidayInfo = await response.json();
      result.dates = bankHolidayInfo.results[0].data.map((record: any) => record.row[0]);
      result.regions = bankHolidayInfo.results[1].data.map((record: any) => record.row[0].name);
      break;
    }
    case 'Person': {
      // We found a person, so we need to run a further query
      // to get the person's roles and organisations
      const usp = new URLSearchParams();
      usp.set('name', info.node.name);
      const response: Response = await fetchWithTimeout(`/person?${usp}`);
      const personInfo = await response.json();
      result.homepage = personInfo.results[0].data[0].row[4].url;
      result.description = personInfo.results[0].data[0].row[4].description;
      result.roles = personInfo.results[0].data.map((result: any) => {
        return {
          title: result.row[2].name,
          orgName: result.row[3]?.name,
          orgUrl: result.row[3]?.homepage,
          startDate: new Date(result.row[1].startDate),
          endDate: result.row[1].endDate ? new Date(result.row[1].endDate) : null
        };
      });
      break;
    }
    case 'Role': {
      // We found a Role, so we need to run a further query to
      // Find the person holding that role (as well as previous people)
      // Find the organisation for this role
      const usp = new URLSearchParams();
      usp.set('name', info.node.name);
      const response: Response = await fetchWithTimeout(`/role?${usp}`);
      const roleInfo = await response.json();
      const role = roleInfo.results[0].data[0];
      const persons = roleInfo.results[1];
      const orgs = roleInfo.results[2];
      result.name = role.row[0].name;
      result.description = role.row[0].description;
      result.personNames = persons.data.map((person: any) => {
        return {
          name: person.row[0].name,
          homepage: person.row[2],
          startDate: new Date(person.row[1].startDate),
          endDate: person.row[1].endDate ? new Date(person.row[1].endDate) : null
        }
      });
      result.orgNames = orgs.data.map((result: any) => result.row[0].name);
      break;
    }
    case 'Organisation': {
      // We found an organisation, so we need to run a further query
      // to get the sub organisations
      const usp = new URLSearchParams();
      usp.set('name', info.node.name);
      const response: Response = await fetchWithTimeout(`/organisation?${usp}`);
      const organisationInfo = await response.json();
      const orgDetails = organisationInfo.results[0].data[0].row;
      const personRoleDetails = organisationInfo.results[1].data;
      const childDetails = organisationInfo.results[2].data;
      const parentDetails = organisationInfo.results[3].data;
      result.homepage = orgDetails[1];
      result.description = orgDetails[0];
      result.parentName = parentDetails.length === 1 ?
        parentDetails[0].row[0] : null;
      result.childOrgNames = childDetails.map((child: Neo4jResultData) => child.row[0]);
      result.personRoleNames = personRoleDetails.map((record: any) => {
        return {
          personName: record.row[0].name,
          roleName: record.row[1].name
        }
      });
      break;
    }
    case 'Transaction': {
      result.homepage = info.homepage.url;
      result.description = info.node.description;
      break;
    }
    case 'Taxon': {
      // We found a taxon so we need to find its homepage
      const usp = new URLSearchParams();
      usp.set('name', info.node.name);
      const response: Response = await fetchWithTimeout(`/taxon?${usp}`);
      const taxonInfo = await response.json();
      result.description = taxonInfo.results[0].data[0].row[0];
      result.homepage = taxonInfo.results[0].data[0].row[1];
      result.ancestorTaxons = taxonInfo.results[1].data.map((ancestor: any) => {
        return {
          url: ancestor.row[0],
          name: ancestor.row[1]
        }
      });
      result.childTaxons = taxonInfo.results[2].data.map((ancestor: any) => {
        return {
          url: ancestor.row[0],
          name: ancestor.row[1]
        }
      });
      break;
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

const fetchWithTimeout = function(url: string, timeoutSeconds: number = 60) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutSeconds * 1000)
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: controller.signal
  });
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
