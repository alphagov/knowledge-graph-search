//==================================================
// Cypher query methods
//==================================================

import { state } from './state';
import { languageCode } from './lang';
import { splitKeywords } from './utils';
import { Neo4jResponse, Neo4jResultData, Neo4jCallback, Neo4jQuery, MetaResult, Neo4jResponseResult } from './neo4j-types';
import { EventType } from './event-types';
import { State } from './state-types';

//=========== public methods ===========

const initNeo4j = async function() {
  console.log('retrieving taxons and locales');
  try {
    const neo4jResponse: Response = await queryNeo4j([
      { statement: 'MATCH (t:Taxon) RETURN t.name' },
      { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
    ], 10);
    const json: Neo4jResponse = await neo4jResponse.json();
    state.taxons = json.results[0].data.map((d: Neo4jResultData) => d.row[0]).sort();
    state.locales = json.results[1].data.map((d: Neo4jResultData) => d.row[0]).sort();
    state.locales = ['', 'en', 'cy'].concat(state.locales);
    console.log(`successfully fetched ${state.taxons.length} taxons and ${state.locales.length} locales`);
  } catch (error) {
    state.errorText = 'Error retrieving taxons and locales';
    console.log('Error retrieving taxons and locales', error);
  }
};


const queryGraph: (state: State, callback: Neo4jCallback) => Promise<void> = async function(state, callback) {

  const mainCypherQuery: Neo4jQuery = { statement: searchQuery(state) };
  const searchKeywords: string = state.selectedWords.replace(/"/g, '');

  const wholeQuery: Neo4jQuery[] = [mainCypherQuery];

  if (searchKeywords.length >= 5 && searchKeywords.includes(' ')) {
    const metaSearchQuery: Neo4jQuery = {
      statement: `
        MATCH (node)
        WHERE (node:BankHoliday OR node:Organisation)
        AND toLower(node.name) CONTAINS toLower($keywords)
        OPTIONAL MATCH (node)-[:HAS_HOMEPAGE]->(homepage:Page)
        RETURN node, homepage, labels(node) as nodeType`,
      parameters: {
        keywords: searchKeywords
      }
    };
    wholeQuery.push(metaSearchQuery);
  }

  callback({ type: EventType.Neo4jRunning });
  queryNeo4j(wholeQuery)
    .then(response => response.json())
    .then(async json => {
      const mainResults: any[] = formattedSearchResults(json.results[0]);
      let metaResults: any[] = json.results.length > 1 && json.results[1].data.length > 0 ?
        formattedSearchResults(json.results[1]) :
        [];

      // If there's an exact match, just keep it
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
  let json;
  let orgData, orgDetails, childDetails, parentDetails;
  let holidayData;

  switch (info.nodeType[0]) {
    // We found a bank holiday, so we need to run 2 further queries
    // one to get the dates, the other to get the regions
    case 'BankHoliday':
      holidayData = await queryNeo4j([
        {
          statement: `
          MATCH (b:BankHoliday)-[:IS_ON]->(d)
          WHERE b.name = $name
          RETURN d`,
          parameters:
            { name: info.node.name }
        }, {
          statement: `
          MATCH (b:BankHoliday)-[:IS_OBSERVED_IN]->(r)
          WHERE b.name = $name
          RETURN r`,
          parameters:
            { name: info.node.name }
        }
      ]);

      json = await holidayData.json();
      result.dates = json.results[0].data.map((record: any) => record.row[0]);
      result.regions = json.results[1].data.map((record: any) => record.row[0].name);
      break;

    case 'Organisation':
      // We found an organisation, so we need to run a further query
      // to get the sub organisations
      orgData = await queryNeo4j([
        {
          statement: `
          MATCH (org:Organisation)-[:HAS_HOMEPAGE]->(homepage:Page)
          WHERE org.name = $name
          RETURN homepage.description, homepage.url`,
          parameters:
            { name: info.node.name }
        }, {
          statement: `
          MATCH (org:Organisation)-[:HAS_CHILD_ORGANISATION]->(childOrg:Organisation)
          WHERE org.name = $name
          AND childOrg.status <> "closed"
          RETURN childOrg.name`,
          parameters:
            { name: info.node.name }
        }, {
          statement: `
          MATCH (org:Organisation)-[:HAS_PARENT_ORGANISATION]->(parentOrg:Organisation)
          WHERE org.name = $name
          RETURN parentOrg.name`,
          parameters:
            { name: info.node.name }
        }
      ]);

      json = await orgData.json();
      orgDetails = json.results[0].data[0].row;
      childDetails = json.results[1].data;
      parentDetails = json.results[2].data;
      result.homepage = orgDetails[1];
      result.description = orgDetails[0];
      result.parentName = parentDetails.length === 1 ?
        parentDetails[0].row[0] : null;
      result.childOrgNames = childDetails.map((child: Neo4jResultData) => child.row[0]);
      break;
    default:
      console.log('unknown meta node type', info.nodeType[0]);
  }
  console.log('result', result);
  return result;
};


const searchQuery = function(state: State): string {
  const fieldsToSearch: string[] = [];
  const keywords = splitKeywords(state.selectedWords);
  const excludedKeywords = splitKeywords(state.excludedWords);
  const combinator = state.combinator === 'any' ? 'OR' : 'AND';
  if (state.whereToSearch.title) fieldsToSearch.push('title');
  if (state.whereToSearch.text) fieldsToSearch.push('text', 'description');
  let inclusionClause = '';
  if (keywords.length > 0) {
    inclusionClause = 'WITH * WHERE\n' +
      keywords
        .map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive))
        .join(`\n ${combinator}`);
  }

  const exclusionClause = excludedKeywords.length ?
    ('WITH * WHERE NOT ' + excludedKeywords.map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive)).join(`\n OR `)) : '';

  let areaClause = '';
  if (state.areaToSearch === 'mainstream') {
    areaClause = 'WITH * WHERE n.publishingApp = "publisher"';
  } else if (state.areaToSearch === 'whitehall') {
    areaClause = 'WITH * WHERE n.publishingApp = "whitehall"';
  }

  let localeClause = '';
  if (state.selectedLocale !== '') {
    localeClause = `WITH * WHERE n.locale = "${languageCode(state.selectedLocale)}"\n`
  }

  const taxon = state.selectedTaxon;
  const taxonClause = taxon ? `
    WITH n
    MATCH (n:Page)-[:IS_TAGGED_TO]->(taxon:Taxon)
    MATCH (taxon:Taxon)-[:HAS_PARENT*]->(ancestor_taxon:Taxon)
    WHERE taxon.name = "${taxon}" OR ancestor_taxon.name = "${taxon}"` :
    `OPTIONAL MATCH (n:Page)-[:IS_TAGGED_TO]->(taxon:Taxon)`;

  let linkClause = '';

  if (state.linkSearchUrl.length > 0) {
    // We need to determine if the link is internal or external
    const internalLinkRexExp = /^((https:\/\/)?((www\.)?gov\.uk))?\//;
    if (internalLinkRexExp.test(state.linkSearchUrl)) {
      linkClause = `
        WITH n, taxon
        MATCH (n:Page)-[:HYPERLINKS_TO]->(n2:Page)
        WHERE n2.url = "https://www.gov.uk${state.linkSearchUrl.replace(internalLinkRexExp, '/')}"`
    } else {
      linkClause = `
        WITH n, taxon
        MATCH (n:Page) -[:HYPERLINKS_TO]-> (e:ExternalPage)
        WHERE e.url CONTAINS "${state.linkSearchUrl}"`
    }
  }

  return `
    MATCH (n:Page)
    WHERE NOT n.documentType IN ['gone', 'redirect', 'placeholder', 'placeholder_person']
    ${inclusionClause}
    ${exclusionClause}
    ${localeClause}
    ${areaClause}
    ${taxonClause}
    ${linkClause}
    OPTIONAL MATCH (n:Page)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
    OPTIONAL MATCH (n:Page)-[:HAS_ORGANISATIONS]->(o2:Organisation)
    ${returnClause()}`;
};


//========== Private methods ==========

const queryNeo4j: (queries: Neo4jQuery[], timeoutSeconds?: number) => Promise<Response> = async function(queries, timeoutSeconds = 60) {
  const body = { statements: queries };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000)

  console.log('sending query to neo4j:', body);
  return fetch('/neo4j', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
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
  return `RETURN
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
    COLLECT (distinct taxon.name) AS taxons,
    COLLECT (distinct o.name) AS primary_organisation,
    COLLECT (distinct o2.name) AS all_organisations
    ORDER BY n.pagerank DESC
    LIMIT ${state.nbResultsLimit}`;
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

export { searchQuery, queryGraph, initNeo4j };
