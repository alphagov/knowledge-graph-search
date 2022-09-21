/* global neo4j */

//==================================================
// Cypher query methods
//==================================================

import { state } from './state.js';
import { languageCode } from './lang.js';
import { splitKeywords } from './utils.js';


//=========== public methods ===========

const initNeo4j = async function(user, password) {
  // Initialise neo4j
  console.log('starting neo4j driver');
  state.neo4jDriver = neo4j.driver(
    state.server,
    neo4j.auth.basic(user, password),
    { // see https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-configuration
      connectionTimeout: 5000
    }
  );

  console.log('checking neo4j connectivity');
  await state.neo4jDriver.verifyConnectivity(
    { database: state.server }
  );

  console.log('starting neo4j session');
  state.neo4jSession = state.neo4jDriver.session({
    defaultAccessMode: neo4j.session.READ,
    fetchSize: 50000
  });

  console.log('neo4j session started', state.neo4jSession);

  // if page is unloaded then close the neo4j connection
  window.addEventListener('beforeunload', async () => {
    console.log('closing session and driver');
    await state.neo4jSession.close();
    await state.neo4jDriver.close();
  });

  try {
    const taxons = await state.neo4jSession.readTransaction(tx =>
      tx.run('MATCH (t:Taxon) RETURN t.name')
    );
    state.taxons = taxons.records.map(taxon => taxon._fields[0]).sort();
  } catch (e) {
    state.errorText = 'Error retrieving taxons.';
  }

  try {
    const locales = await state.neo4jSession.readTransaction(tx =>
      tx.run('MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale')
    );
    state.locales = locales.records.map(locale => locale._fields[0]).sort();
    state.locales = ['', 'en', 'cy'].concat(state.locales);
  } catch (e) {
    state.errorText = 'Error retrieving locales.';
    console.log('Error retrieving locales:', e);
  }
};


const queryGraph = async function(state, callback) {
  const metaSearchQuery = `
    MATCH (b)
    WHERE (b:BankHoliday OR b:Person OR b:Organisation OR b:Role)
    AND toLower(b.name) CONTAINS toLower($keywords)
    OPTIONAL MATCH (b)-[:HAS_HOMEPAGE]->(p:Page)
    RETURN b,p`;

  state.neo4jSession.readTransaction(txc => {
    const mainCypherQuery = searchQuery(state);
    console.log('running main cypher query', mainCypherQuery);

    const mainQueryPromise = txc.run(mainCypherQuery);
    const allPromises = [mainQueryPromise];

    const searchKeywords = state.selectedWords.replace(/"/g,'');
    if (searchKeywords.length >= 5 && searchKeywords.includes(' ')) {
      console.log('running meta cypher query', metaSearchQuery);
      const metaQueryPromise = txc.run(
        metaSearchQuery,
        { keywords: searchKeywords}
      );
      allPromises.push(metaQueryPromise);
    }
    callback({type: 'neo4j-running'});
    Promise.allSettled(allPromises)
      .then(async results => {
        console.log(`neo4j returned ${results.length} results`);

        const mainResults = formattedMainSearchResults(results[0].value);
        let metaResults = results.length === 2 ? formattedMetaSearchResults(results[1].value) : [];

        // If there's an exact match, just keep it
        const exactMetaResults = metaResults.filter(result => {
          return result.name.toLowerCase() === searchKeywords.toLowerCase()
        });

        if (exactMetaResults.length === 1) {
          metaResults = exactMetaResults;
        }

        if (metaResults.length === 1) {
          // one meta result: show the knowledge panel
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
        console.log('error', error);
        callback({type:'neo4j-callback-fail', error })
      });
  });
};

//=========== private ===========

const buildMetaboxInfo = async function(info) {
  const result = info;
  switch (info.type) {
    // We found a bank holiday, so we need to run 2 further queries
    // one to get the dates, the other to get the regions
  case 'BankHoliday':
    await state.neo4jSession.readTransaction(async txc => {
      const resultsDates = await txc.run(
        `MATCH (b:BankHoliday)-[:IS_ON]->(d)
         WHERE b.name = $name
         RETURN d`,
        { name: info.name }
      );
      result.dates = resultsDates.records.map(record => record._fields[0].properties.dateString);
    });
    await state.neo4jSession.readTransaction(async txc => {
      const resultsRegions = await txc.run(
        `MATCH (b:BankHoliday)-[:IS_OBSERVED_IN]->(r)
         WHERE b.name = $name
         RETURN r`,
        { name: info.name }
      );
      result.regions = resultsRegions.records.map(record => record._fields[0].properties.name);
    });
    break;
  case 'Person':
    // We found a person, so we need to run a further query
    // to get the person's roles and organisations
    await state.neo4jSession.readTransaction(async txc => {
      const resultsRoles = await txc.run(
        `MATCH (p:Person)-[l]->(r:Role)-[l2]->(o:Organisation)
         WHERE p.name = $name
         WITH p, l, r, l2, o
         MATCH (p)-[:HAS_HOMEPAGE]->(ph:Page)
         OPTIONAL MATCH (r)-[:HAS_HOMEPAGE]->(rh:Page)
         RETURN p,l,r,l2,o,ph,rh`,
        { name: info.name }
      );
      result.homepage = resultsRoles.records[0]?._fields[5].properties.url;
      result.roles = resultsRoles.records.map(result => {
        return {
          name: result._fields[2].properties.name,
          orgName: result._fields[4].properties.name,
          orgUrl: result._fields[4].properties.url,
          startDate: jsDate(result._fields[1].properties.startDate),
          endDate: jsDate(result._fields[1].properties.endDate)
        };
      });
    });
    break;
  case 'Role':
    // We found a Role, so we need to run a further query to
    // Find the person holding that role (as well as previous people)
    // Find the organisation for this role
    await state.neo4jSession.readTransaction(async txc => {
      const resultsRoles = await txc.run(
        `MATCH (person:Person)-[has_role:HAS_ROLE]->(role:Role)-[belongs_to:BELONGS_TO]->(org:Organisation)
         MATCH (person:Person)-[:HAS_HOMEPAGE]->(homepage:Page)
         WHERE role.name = $name
         RETURN person, has_role, homepage, COLLECT (DISTINCT org) as orgs`,
        { name: info.name }
      );
      result.orgNames = resultsRoles.records[0]._fields[3].map(org => org.properties.name);
      result.persons = resultsRoles.records.map(result => {
        return {
          personName: result._fields[0].properties.name,
          personHomepage: result._fields[2].properties.url,

          roleStartDate: jsDate(result._fields[1].properties.startDate),
          roleEndDate: jsDate(result._fields[1].properties.endDate)
        };
      });
    });
    break;
  case 'Organisation':
    // We found an organisation, so we need to run a further query
    // to get the sub organisations
    await state.neo4jSession.readTransaction(async txc => {

      const orgDetails = await txc.run(`
        MATCH (org:Organisation)-[:HAS_HOMEPAGE]->(homepage:Page)
        WHERE org.name = $name
        RETURN homepage.description, homepage.url
      `, { name: info.name });

      const personRoleDetails = await txc.run(`
        MATCH (person:Person)-[hr:HAS_ROLE]->(role:Role)-[:BELONGS_TO]->(org:Organisation)
        WHERE org.name = $name
        AND hr.endDate IS NULL
        RETURN person, role
      `, { name: info.name });

      const childDetails = await txc.run(`
        MATCH (org:Organisation)-[:HAS_CHILD]->(childOrg:Organisation)
        WHERE org.name = $name
        AND childOrg.status <> "closed"
        RETURN childOrg.name
      `, { name: info.name });

      const parentDetails = await txc.run(`
        MATCH (org:Organisation)<-[:HAS_CHILD]-(parentOrg:Organisation)
        WHERE org.name = $name
        RETURN parentOrg.name
      `, { name: info.name });

      result.homepage = orgDetails.records[0]._fields[1];
      result.description = orgDetails.records[0]._fields[0];

      result.parentName = parentDetails.records.length === 1 ?
        parentDetails.records[0]._fields[0] : null;

      result.childOrgNames = childDetails.records.map(record=>record._fields[0]);
      result.personRoleNames = personRoleDetails.records.map(record=>{ return {
        personName: record._fields[0].properties.name,
        roleName: record._fields[1].properties.name
      }});
    });
    break;
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

const formattedMetaSearchResults = neo4jResults =>
  neo4jResults.records.map(result => {
    return {
      type: result._fields[0].labels[0],
      ...result._fields[0].properties
    }
  });


const formattedMainSearchResults = neo4jResults => {
  return neo4jResults.records.map(result => {
    const resultAsRecord = {};
    result.keys.forEach((key, idx) => resultAsRecord[key] = result._fields[idx]);
    return resultAsRecord;
  });
};


const jsDate = neo4jDateTime => {
  if (!neo4jDateTime) return null;
  const { year, month, day, hour, minute, second, nanosecond } = neo4jDateTime;
  const date = new Date(
    year.toInt(),
    month.toInt() - 1, // neo4j dates start at 1, js dates start at 0
    day.toInt(),
    hour.toInt(),
    minute.toInt(),
    second.toInt(),
    nanosecond.toInt() / 1000000 // js dates use milliseconds
  );
  return date;
};


export { searchQuery, queryGraph, initNeo4j };
