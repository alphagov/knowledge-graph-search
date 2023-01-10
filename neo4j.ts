import axios from 'axios';
import { MainResult, MetaResult, Person, Organisation, Role, Taxon, BankHoliday } from './src/ts/search-api-types';
import { splitKeywords } from './src/ts/utils';
import { languageCode } from './src/ts/lang';
import { Neo4jQuery, Neo4jResponseResult, Neo4jResponse, Neo4jResultData } from './neo4j-types';
import { GetBankHolidayInfoSignature, GetOrganisationInfoSignature, GetPersonInfoSignature, GetRoleInfoSignature, GetTaxonInfoSignature, SendInitQuerySignature, SendSearchQuerySignature } from './db-api-types';


const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx"
};


// Send a Cypher query to the Neo4j server
const sendSearchQuery: SendSearchQuerySignature = async function(searchParams) {

  // build the neo4j query from the search params extracted from the body
  const mainQuery: Neo4jQuery = {
    statement: buildSearchQuery(searchParams)
  };

  const wholeQuery = [mainQuery];

  const searchKeywords: string = searchParams.selectedWords.replace(/"/g, '');
  if (searchKeywords.length >= 5 && searchKeywords.includes(' ')) {
    const metaQuery: Neo4jQuery = {
      statement: `
        MATCH (node)
        WHERE (node:BankHoliday OR node:Person OR node:Organisation OR node:Role OR node:Transaction OR node:Taxon)
        AND toLower(node.name) CONTAINS toLower($keywords)
        OPTIONAL MATCH (node)-[:HAS_HOMEPAGE|HAS_START_PAGE]->(homepage:Page)
        RETURN node, homepage, labels(node) as nodeType`,
      parameters: { keywords: searchKeywords }
    };
    wholeQuery.push(metaQuery);
  }
  const dbResponse = await sendCypherQuery(wholeQuery, 60000);
  const mainResults: MainResult[] = formattedMainResults(dbResponse.results[0]);
  const metaResults: MetaResult[] = dbResponse.results[1]?.data.length > 0 ?
    formattedMetaResults(dbResponse.results[1]) :
    [];
  return { mainResults, metaResults };
}

const sendInitQuery: SendInitQuerySignature = async function() {
  const query: Neo4jQuery[] = [
    { statement: 'MATCH (t:Taxon) RETURN t.name' },
    { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
  ];
  const response = await sendCypherQuery(query, 10000);
  return {
    taxons: response.results[0].data.map((d: Neo4jResultData) => d.row[0]).sort(),
    locales: ['', 'en', 'cy'].concat(response.results[1].data.map((d: Neo4jResultData) => d.row[0]).sort())
  };
}

const getTaxonInfo: GetTaxonInfoSignature = async function(name) {
  const query: Neo4jQuery[] = [
    { // Get details about this taxon
      statement: `
        MATCH (p:Page)<-[:HAS_HOMEPAGE]-(t:Taxon { name: $name })
        RETURN p.description, p.url, t.level`,
      parameters:
        { name: name }
    },
    { // Get list of ancestor taxons
      statement: `
        MATCH (homepage:Page)<-[:HAS_HOMEPAGE]-(ancestor:Taxon)<-[:HAS_PARENT*]-(:Taxon { name: $name })
        RETURN homepage.url, ancestor.name, ancestor.level`,
      parameters:
        { name: name }
    },
    { // Get list of child taxons
      statement: `
        MATCH (homepage:Page)<-[:HAS_HOMEPAGE]-(child:Taxon)-[:HAS_PARENT]->(:Taxon { name: $name })
        RETURN homepage.url, child.name, child.level`,
      parameters:
        { name: name }
    }
  ];
  const taxonInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const result: Taxon = {
    type: 'Taxon',
    name,
    description: taxonInfo.results[0].data[0].row[0],
    homepage: taxonInfo.results[0].data[0].row[1],
    level: taxonInfo.results[0].data[0].row[2],
    ancestorTaxons: taxonInfo.results[1].data.map((ancestor: any) => {
      return {
        url: ancestor.row[0],
        name: ancestor.row[1],
        level: ancestor.row[2],
      }
    }),
    childTaxons: taxonInfo.results[2].data.map((child: any) => {
      return {
        url: child.row[0],
        name: child.row[1],
        level: child.row[2]
      }
    })
  };
  console.log('skdjnf', result);
  return result;
};


const getOrganisationInfo: GetOrganisationInfoSignature = async function(name) {
  const query: Neo4jQuery[] = [
    {
      statement: `
        MATCH (org:Organisation)-[:HAS_HOMEPAGE]->(homepage:Page)
        WHERE org.name = $name
        RETURN homepage.description, homepage.url`,
      parameters:
        { name: name }
    }, {
      statement: `
        MATCH (person:Person)-[hr:HAS_ROLE]->(role:Role)-[:BELONGS_TO]->(org:Organisation)
        WHERE org.name = $name
        AND hr.endDate IS NULL
        RETURN person, role`,
      parameters:
        { name: name }
    }, {
      statement: `
        MATCH (org:Organisation)-[:HAS_CHILD_ORGANISATION]->(childOrg:Organisation)
        WHERE org.name = $name
        AND childOrg.status <> "closed"
        RETURN childOrg.name`,
      parameters: { name }
    }, {
      statement: `
        MATCH (org:Organisation)-[:HAS_PARENT_ORGANISATION]->(parentOrg:Organisation)
        WHERE org.name = $name
        RETURN parentOrg.name`,
      parameters: { name }
    }, {
      statement: `
        MATCH (supersedingOrg)-[:HAS_SUPERSEDED]->(org:Organisation)
        WHERE org.name = $name
        RETURN supersedingOrg.name`,
      parameters: { name }
    }, {
      statement: `
        MATCH (org:Organisation)-[:HAS_SUPERSEDED]->(supersededOrg:Organisation)
        WHERE org.name = $name
        RETURN supersededOrg.name`,
      parameters: { name }
    }
  ];
  const orgInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const orgDetails = orgInfo.results[0].data[0].row;
  const personRoleDetails = orgInfo.results[1].data;
  const childDetails = orgInfo.results[2].data;
  const parentDetails = orgInfo.results[3].data;
  const supersedingDetails = orgInfo.results[4].data;
  const supersededDetails = orgInfo.results[5].data;
  const result: Organisation = {
    type: 'Organisation',
    name,
    homepage: orgDetails[1],
    description: orgDetails[0],
    parentName: parentDetails.length === 1 ? parentDetails[0].row[0] : null,
    childOrgNames: childDetails.map((child: Neo4jResultData) => child.row[0]),
    personRoleNames: personRoleDetails.map((record: any) => {
      return {
        personName: record.row[0].name,
        roleName: record.row[1].name
      }
    }),
    supersededBy: supersedingDetails.map((d: Neo4jResultData) => d.row[0]),
    supersedes: supersededDetails.map((d: Neo4jResultData) => d.row[0])
  };
  return result;
};


const getRoleInfo: GetRoleInfoSignature = async function(name) {
  const query: Neo4jQuery[] = [
    {
      statement: `MATCH (r:Role { name: $name }) RETURN r`,
      parameters: { name }
    },
    {
      statement: `
        MATCH (p:Person)-[h:HAS_ROLE]->(Role { name: $name })
        MATCH (p:Person)-[:HAS_HOMEPAGE]->(hp:Page)
        RETURN p,h,hp.url`,
      parameters: { name }
    },
    {
      statement: `MATCH (Role { name: $name })-[:BELONGS_TO]->(o:Organisation) RETURN o`,
      parameters: { name }
    }
  ];
  const roleInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const role = roleInfo.results[0].data[0];
  const persons = roleInfo.results[1];
  const orgs = roleInfo.results[2];
  const result: Role = {
    type: 'Role',
    name: role.row[0].name,
    description: role.row[0].description,
    personNames: persons.data.map((person: any) => {
      return {
        name: person.row[0].name,
        homepage: person.row[2],
        startDate: new Date(person.row[1].startDate),
        endDate: person.row[1].endDate ? new Date(person.row[1].endDate) : null
      }
    }),
    orgNames: orgs.data.map((result: any) => result.row[0].name)
  };
  return result;
};


const getPersonInfo: GetPersonInfoSignature = async function(name) {
  const query: Neo4jQuery[] = [
    {
      statement: `
        MATCH (p:Person { name: $name })-[l]->(r:Role)
        MATCH (p)-[:HAS_HOMEPAGE]->(ph:Page)
        OPTIONAL MATCH (r)-[:BELONGS_TO]->(o:Organisation)
        OPTIONAL MATCH (r)-[:HAS_HOMEPAGE]->(rh:Page)
        RETURN p,l,r,o,ph,rh`,
      parameters:
        { name }
    }
  ];
  const personInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const result: Person = {
    type: 'Person',
    name,
    homepage: personInfo.results[0].data[0].row[4].url,
    description: personInfo.results[0].data[0].row[4].description,
    roles: personInfo.results[0].data.map((result: any) => {
      return {
        title: result.row[2].name,
        orgName: result.row[3]?.name,
        orgUrl: result.row[3]?.homepage,
        startDate: new Date(result.row[1].startDate),
        endDate: result.row[1].endDate ? new Date(result.row[1].endDate) : null
      }
    })
  };
  return result;
};


const getBankHolidayInfo: GetBankHolidayInfoSignature = async function(name) {
  const query: Neo4jQuery[] = [
    {
      statement: `
        MATCH (b:BankHoliday)-[:IS_ON]->(d)
        WHERE b.name = $name
        RETURN d`,
      parameters: { name }
    }, {
      statement: `
        MATCH (b:BankHoliday)-[:IS_OBSERVED_IN]->(r)
        WHERE b.name = $name
        RETURN r`,
      parameters: { name }
    }
  ];
  const bankHolidayInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const result: BankHoliday = {
    type: 'BankHoliday',
    name,
    dates: bankHolidayInfo.results[0].data.map((record: any) => record.row[0]),
    regions: bankHolidayInfo.results[1].data.map((record: any) => record.row[0].name)
  }
  return result;
};


const sendCypherQuery = async function(cypherQuery: Neo4jQuery[], timeout: number) {
  console.log('sending', JSON.stringify(cypherQuery, null, 2), 'with timeout', timeout);
  const { data } = await axios.post(
    neo4jParams.url,
    { statements: cypherQuery },
    { timeout, headers: { 'Content-Type': 'application/json' } }
  );
  return data;
};


const formattedMainResults = (neo4jResults: Neo4jResponseResult): MainResult[] => {
  const keys = neo4jResults.columns;
  const results: MainResult[] = [];
  neo4jResults.data.forEach(val => {
    const result: Record<string, number> = {};
    keys.forEach((key: string, i: number) => result[key] = val.row[i]);
    results.push(result);
  });
  return results;
};

const formattedMetaResults = (neo4jResults: Neo4jResponseResult): MetaResult[] => {
  const keys = neo4jResults.columns;
  const results: any[] = [];
  neo4jResults.data.forEach(val => {
    const result: Record<string, number> = {};
    keys.forEach((key: string, i: number) => result[key] = val.row[i]);
    results.push(result);
  });
  return results;
};


const buildSearchQuery = function(searchParams: any): string {
  const fieldsToSearch: string[] = [];
  const keywords = splitKeywords(searchParams.selectedWords);
  const excludedKeywords = splitKeywords(searchParams.excludedWords);
  const combinator = searchParams.combinator === 'any' ? 'OR' : 'AND';
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
    ${returnClause()}
  `;
};


//========== Private methods ==========


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
    n.contentId AS contentId,
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


export { sendSearchQuery, sendInitQuery, getTaxonInfo, getOrganisationInfo, getRoleInfo, getPersonInfo, getBankHolidayInfo };
