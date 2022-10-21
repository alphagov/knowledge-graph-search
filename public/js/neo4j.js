//==================================================
// Cypher query methods
//==================================================

import { state } from './state.js';
import { languageCode } from './lang.js';
import { splitKeywords } from './utils.js';

//=========== public methods ===========

const initNeo4j = async function() {
  console.log('retrieving taxons and locales');
  try {
    const neo4jResponse = await queryNeo4j([
      { statement: 'MATCH (t:Taxon) RETURN t.name' },
      { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
    ])
    const json = await neo4jResponse.json();
    state.taxons = json.results[0].data.map(d => d.row[0]).sort();
    state.locales = json.results[1].data.map(l => l.row[0]).sort();
    state.locales = ['', 'en', 'cy'].concat(state.locales);
    console.log(`successfully fetched ${state.taxons.length} taxons and ${state.locales.length} locales`);
  } catch (error) {
    state.errorText = 'Error retrieving taxons and locales';
    console.log('Error retrieving taxons and locales', error);
  }
};


const queryGraph = async function(state, callback) {

  const mainCypherQuery = { statement: searchQuery(state) };
  const searchKeywords = state.selectedWords.replace(/"/g, '');

  const wholeQuery = [mainCypherQuery];

  if (searchKeywords.length >= 5 && searchKeywords.includes(' ')) {
    const metaSearchQuery = {
      statement: `
        MATCH (node)
        WHERE (node:BankHoliday OR node:Person OR node:Organisation OR node:Role)
        AND toLower(node.name) CONTAINS toLower($keywords)
        OPTIONAL MATCH (node)-[:HAS_HOMEPAGE]->(homepage:Page)
        RETURN node, homepage, labels(node) as nodeType`,
      parameters: {
        keywords: searchKeywords
      }
    };
    wholeQuery.push(metaSearchQuery);
  }

  callback({type: 'neo4j-running'});
  console.log('running cypher', wholeQuery)
  queryNeo4j(wholeQuery)
  .then(response => response.json())
  .then(async json => {
    const mainResults = formattedSearchResults(json.results[0]);
    let metaResults = json.results[1]?.data.length > 0 ?
        formattedSearchResults(json.results[1]) :
        [];
    // If there's an exact match, just keep it
    const exactMetaResults = metaResults.filter(result => {
      return result.node.name.toLowerCase() === searchKeywords.toLowerCase()
    });

    if (exactMetaResults.length === 1) {
      metaResults = exactMetaResults;
    }

    if (metaResults.length === 1) {
      // one meta result: show the knowledge panel (may require more neo4j queries)
      const fullMetaResults = await buildMetaboxInfo(metaResults[0]);
      callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: [fullMetaResults] }});
    } else if (metaResults.length >= 1) {
      // multiple meta results: we'll show a disambiguation page
      callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: metaResults }});
    } else {
      // no meta results
      callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: null }});
    }
  })
    .catch(error => {
      console.log('error running main+meta queries', error);
      callback({type:'neo4j-callback-fail', error })
    });
};

//=========== private ===========

const buildMetaboxInfo = async function(info) {
  console.log(`Found a ${info.nodeType[0]}. Running extra queries`);
  const result = { type: info.nodeType[0], name: info.node.name };
  let json;
  let orgData, orgDetails, personRoleDetails, childDetails, parentDetails;
  let holidayData, personData, roleData;

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
    result.dates = json.results[0].data.map(record => record.row[0]);
    result.regions = json.results[1].data.map(record => record.row[0].name);
    break;

  case 'Person':
    // We found a person, so we need to run a further query
    // to get the person's roles and organisations
    personData = await queryNeo4j([
      {
        statement: `
          MATCH (p:Person { name: $name })-[l]->(r:Role)
          MATCH (p)-[:HAS_HOMEPAGE]->(ph:Page)
          OPTIONAL MATCH (r)-[:BELONGS_TO]->(o:Organisation)
          OPTIONAL MATCH (r)-[:HAS_HOMEPAGE]->(rh:Page)
          RETURN p,l,r,o,ph,rh`,
        parameters:
          { name: info.node.name }
      }
    ]);

    json = await personData.json();
    result.homepage = json.results[0].data[0].row[0].url;
    result.description = json.results[0].data[0].row[4].description;
    result.roles = json.results[0].data.map(result => {
      return {
        title: result.row[2].title,
        orgName: result.row[3]?.name,
        orgUrl: result.row[3]?.homepage,
        startDate: new Date(result.row[1].startDate),
        endDate: result.row[1].endDate ? new Date(result.row[1].endDate) : null
      };
    });
    break;
  case 'Role':
    // We found a Role, so we need to run a further query to
    // Find the person holding that role (as well as previous people)
    // Find the organisation for this role
    roleData = await queryNeo4j([
      {
        statement: `
          MATCH (role:Role { name: $name })
          OPTIONAL MATCH (person:Person)-[has_role:HAS_ROLE]->(role)
          OPTIONAL MATCH (role:Role)-[belongs_to:BELONGS_TO]->(org:Organisation)
          RETURN role, COLLECT(DISTINCT person) as persons, COLLECT(DISTINCT org) as orgs`,

        parameters: { name: info.node.name }
      }
    ])

    json = await roleData.json();
    result.name = json.results[0].data[0].row[0].name;
    result.orgNames = json.results[0].data[0].row[2].map(result => result.name);
    result.personNames = json.results[0].data[0].row[1].map(result => result.name);
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
          MATCH (person:Person)-[hr:HAS_ROLE]->(role:Role)-[:BELONGS_TO]->(org:Organisation)
          WHERE org.name = $name
          AND hr.endDate IS NULL
          RETURN person, role`,
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
    personRoleDetails = json.results[1].data;
    childDetails = json.results[2].data;
    parentDetails = json.results[3].data;
    result.homepage = orgDetails[1];
    result.description = orgDetails[0];
    result.parentName = parentDetails.length === 1 ?
      parentDetails[0].row[0] : null;
    result.childOrgNames = childDetails.map(child => child.row[0]);
    result.personRoleNames = personRoleDetails.map(record=>{ return {
      personName: record.row[0].name,
      roleName: record.row[1].name
    }});
    break;
    default:
    console.log('unknown meta node type', info.nodeType[0]);
  }
  return result;
};


const searchQuery = function(state) {
  const fieldsToSearch = [];
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

const queryNeo4j = async function(queries) {
  console.log('queryNeo4j', queries);
  const body = { statements: queries };
  return fetch('/neo4j', {
    method:'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
};


const containsClause = function(field, word, caseSensitive) {
  return caseSensitive ?
    `(n.${field} CONTAINS "${word}")`
  :
    `(toLower(n.${field}) CONTAINS toLower("${word}"))`
  ;
}


const multiContainsClause = function(fields, word, caseSensitive) {
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


const formattedSearchResults = neo4jResults => {
  const keys = neo4jResults.columns;
  const results = [];
  neo4jResults.data.forEach(val => {
    const result = {};
    keys.forEach((key, i) => result[key] = val.row[i]);
    results.push(result);
  });
  return results;
};

export { searchQuery, queryGraph, initNeo4j };
