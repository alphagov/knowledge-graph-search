//==================================================
// Cypher query methods
//==================================================

import { state } from './state.js';
import { languageCode } from './lang.js';
import { splitKeywords } from './utils.js';


//=========== public methods ===========

const queryGraph = async function(state, callback) {

  // const metaSearchQueries = [
  //   `MATCH (b:BankHoliday)-[l]->(d)
  //    WHERE toLower(b.name) CONTAINS toLower($keywords)
  //    RETURN b,l,d`,

  //   `MATCH (p:Person)-[l]->(t:Role)-[l2]->(o:Organisation)
  //    WHERE toLower(p.name) CONTAINS toLower($keywords)
  //    RETURN p,l,t,l2,o`,

  //   `MATCH (o:Organisation)
  //    WHERE toLower(o.name) CONTAINS toLower($keywords)
  //    AND o.status <> "closed"
  //    WITH o
  //    OPTIONAL MATCH (o)-[l:HAS_CHILD]->(n:Organisation)
  //    WHERE n.status <> "closed"
  //    RETURN o, l, n`
  // ];


  const metaSearchQuery = `
    MATCH (b)
    WHERE (b:BankHoliday OR b:Person OR b:Organisation)
    AND toLower(b.name) CONTAINS toLower($keywords)
    RETURN b`;

  state.neo4jSession.readTransaction(txc => {
    const mainCypherQuery = searchQuery(state);
    console.log('running cypher queries', mainCypherQuery, metaSearchQuery);
    const mainQueryPromise = txc.run(mainCypherQuery);
    const metaQueryPromise = txc.run(
      metaSearchQuery,
      { keywords: state.selectedWords.replace(/"/g,'')}
    );

    callback({type: 'neo4j-running'});
    Promise.allSettled([mainQueryPromise, metaQueryPromise])
      .then(async results => {
        const mainResults = formattedMainSearchResults(results[0].value);
        const metaResults = formattedMetaSearchResults(results[1].value);
        if (metaResults.length === 1) {
          switch (metaResults[0].type) {
            // We found a bank holiday, so we need to run 2 further queries
            // one to get the dates, the other to get the regions
            case 'BankHoliday':
            await state.neo4jSession.readTransaction(async txc => {
              const resultsDates = await txc.run(
                `MATCH (b:BankHoliday)-[:IS_ON]->(d)
                 WHERE b.name = $name
                 RETURN d`,
                { name: metaResults[0].name }
              );
              metaResults[0].dates = resultsDates.records.map(record => record._fields[0].properties.dateString);
            });
            await state.neo4jSession.readTransaction(async txc => {
              const resultsRegions = await txc.run(
                `MATCH (b:BankHoliday)-[:IS_OBSERVED_IN]->(r)
                 WHERE b.name = $name
                 RETURN r`,
                { name: metaResults[0].name }
              );
            metaResults[0].regions = resultsRegions.records.map(record => record._fields[0].properties.name);
            });
            callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: metaResults }});
            break;
            case 'Person':
            // We found a person, so we need to run a further query
            // to get the person's roles and organisations
            await state.neo4jSession.readTransaction(async txc => {
              const resultsRoles = await txc.run(
                `MATCH (p:Person)-[l]->(t:Role)-[l2]->(o:Organisation)
                 WHERE p.name = $name
                 RETURN p,l,t,l2,o`,
                { name: metaResults[0].name }
              );
              metaResults[0].roles = resultsRoles.records.map(result => {
                return {
                  name: result._fields[2].properties.name,
                  orgName: result._fields[4].properties.name,
                  orgUrl: result._fields[4].properties.url,
                  startDate: result._fields[1].properties.startDate,
                  endDate: result._fields[1].properties.endDate
                };
              })
              callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: metaResults }});
            });
            break;
            case 'Organisation':
            // We found an organisation, so we need to run a further query
            // to get the sub organisations
            await state.neo4jSession.readTransaction(async txc => {
              const resultsSubOrgs = await txc.run(
                `MATCH (o:Organisation)
                 WHERE o.name = $name
                 AND o.status <> "closed"
                 WITH o
                 OPTIONAL MATCH (o)-[l:HAS_CHILD]->(n:Organisation)
                 WHERE n.status <> "closed"
                 RETURN o, l, n`,
                { name: metaResults[0].name }
              );
              metaResults[0].subOrgs = resultsSubOrgs.records
                .map(result => result._fields[2].properties);
            });
            break;
          }
        } else if (metaResults.length >= 1) {
          // TODO: create a disambiguation page
        }
        callback({type:'neo4j-callback-ok', results: { main: mainResults, meta: metaResults }});
      })
      .catch(error => {
        console.log('error', error);
        callback({type:'neo4j-callback-fail', error })
      });
  });
};

//=========== private ===========

const searchQuery = function(state) {
  const fieldsToSearch = [];
  const keywords = splitKeywords(state.selectedWords);
  const excludedKeywords = splitKeywords(state.excludedWords);
  const combinator = state.combinator === 'any' ? 'OR' : 'AND';
  if (state.whereToSearch.title) fieldsToSearch.push('title');
  if (state.whereToSearch.text) fieldsToSearch.push('text', 'description');
  let inclusionClause = '';
  if (keywords.length > 0) {
    inclusionClause = 'WHERE\n' +
    keywords
      .map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive))
      .join(`\n ${combinator}`);
  }

  const exclusionClause = excludedKeywords.length ?
    ('WITH * WHERE NOT ' + excludedKeywords.map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive)).join(`\n OR `)) : '';

  let areaClause = '';
  if (state.areaToSearch === 'mainstream') {
    areaClause = 'WITH * WHERE n.publishing_app = "publisher"';
  } else if (state.areaToSearch === 'whitehall') {
    areaClause = 'WITH * WHERE n.publishing_app = "whitehall"';
  }

  let localeClause = '';
  if (state.selectedLocale !== '') {
    localeClause = `WITH * WHERE n.locale = "${languageCode(state.selectedLocale)}"\n`
  }

  const taxon = state.selectedTaxon;
  const taxonClause = taxon ? `WITH n
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
    n.publishing_app AS publishing_app,
    n.first_published_at AS first_published_at,
    n.public_updated_at AS public_updated_at,
    n.withdrawn_at AS withdrawn_at,
    n.withdrawn_explanation AS withdrawn_explanation,
    n.pagerank AS pagerank,
    COLLECT (distinct taxon.name) AS taxons,
    COLLECT (distinct o.name) AS primary_organisation,
    COLLECT (distinct o2.name) AS all_organisations
    ORDER BY n.pagerank DESC
    LIMIT ${state.nbResultsLimit}`;
};

const formattedMetaSearchResults = neo4jResults =>
  neo4jResults.records.map(result => {
    switch (result._fields[0].labels[0]) {
      case 'Person': return {
        type: 'Person',
        name: result._fields[0].properties.name
      }
      case 'Organisation': return {
        type: 'Organisation',
        name: result._fields[0].properties.name
      }
      case 'BankHoliday': return {
        type: 'BankHoliday',
        name: result._fields[0].properties.name
      }
      default: return {
        type: 'unknown'
      }
    }
  });

const formattedMainSearchResults = neo4jResults => {
  return neo4jResults.records.map(result => {
    const resultAsRecord = {};
    result.keys.forEach((key, idx) => resultAsRecord[key] = result._fields[idx]);
    return resultAsRecord;
  });
};

export { searchQuery, queryGraph };
