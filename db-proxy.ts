import axios from 'axios';
import { SearchParams } from './src/ts/search-types';
import { mainCypherQuery } from './src/ts/neo4j';
import { MetaResult, Neo4jQuery, Neo4jResponse, ResultRole, Neo4jResultData, Neo4jResponseResult } from './src/ts/neo4j-types';


const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx"
};


// Send a Cypher query to the Neo4j server
const sendCypherSearchQuery = async function(searchParams: SearchParams) {
  console.log('sendCypherSearchQuery');

  // build the neo4j query from the search params extracted from the body
  const mainQuery: Neo4jQuery = {
    statement: mainCypherQuery(searchParams)
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
  const mainResults: any[] = formattedSearchResults(dbResponse.results[0]);
  const metaResults: any[] = dbResponse.results[1]?.data.length > 0 ?
    formattedSearchResults(dbResponse.results[1]) :
    [];
  return { mainResults, metaResults };
}

const sendCypherInitQuery = async function() {
  const query: Neo4jQuery[] = [
    { statement: 'MATCH (t:Taxon) RETURN t.name' },
    { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
  ];
  // TODO: decode cypher results here and return a API-friendly response
  const response = await sendCypherQuery(query, 5000);
  return {
    taxons: response.results[0].data.map((d: Neo4jResultData) => d.row[0]).sort(),
    locales: ['', 'en', 'cy'].concat(response.results[1].data.map((d: Neo4jResultData) => d.row[0]).sort())
  };
}

const getTaxonInfo = async function(name: string) {
  const query: Neo4jQuery[] = [
    { // Get details about this taxon
      statement: `
        MATCH (p:Page)<-[:HAS_HOMEPAGE]-(t:Taxon { name: $name })
        RETURN p.description, p.url`,
      parameters:
        { name: name }
    },
    { // Get list of ancestor taxons
      statement: `
        MATCH (h:Page)<-[:HAS_HOMEPAGE]-(:Taxon)<-[:HAS_PARENT*]-(:Taxon { name: $name })
        RETURN h.url, h.title`,
      parameters:
        { name: name }
    },
    { // Get list of child taxons
      statement: `
        MATCH (h:Page)<-[:HAS_HOMEPAGE]-(:Taxon)-[:HAS_PARENT]->(:Taxon { name: $name })
        RETURN h.url, h.title`,
      parameters:
        { name: name }
    }
  ];
  const taxonInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const result: MetaResult = {
    type: 'Taxon',
    name,
    description: taxonInfo.results[0].data[0].row[0],
    homepage: taxonInfo.results[0].data[0].row[1],
    ancestorTaxons: taxonInfo.results[1].data.map((ancestor: any) => {
      return {
        url: ancestor.row[0],
        name: ancestor.row[1]
      }
    }),
    childTaxons: taxonInfo.results[2].data.map((ancestor: any) => {
      return {
        url: ancestor.row[0],
        name: ancestor.row[1]
      }
    })
  };
  return result;
};


const getOrganisationInfo = async function(name: string) {
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
    }
  ];
  const orgInfo: Neo4jResponse = await sendCypherQuery(query, 5000);
  const orgDetails = orgInfo.results[0].data[0].row;
  const personRoleDetails = orgInfo.results[1].data;
  const childDetails = orgInfo.results[2].data;
  const parentDetails = orgInfo.results[3].data;
  const result: MetaResult = {
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
    })
  };
  return result;
};


const getRoleInfo = async function(name: string) {
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
  const result: MetaResult = {
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


const getPersonInfo = async function(name: string) {
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
  const result: MetaResult = {
    type: 'Person',
    name,
    homepage: personInfo.results[0].data[0].row[4].url,
    description: personInfo.results[0].data[0].row[4].description,
    roles: personInfo.results[0].data.map((result: any) => {
      const res: ResultRole = {
        title: result.row[2].name,
        orgName: result.row[3]?.name,
        orgUrl: result.row[3]?.homepage,
        startDate: new Date(result.row[1].startDate),
        endDate: result.row[1].endDate ? new Date(result.row[1].endDate) : null
      };
      return res;
    })
  };
  return result;
};


const getBankHolidayInfo = async function(name: string) {
  console.log('NAME', name)
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
  console.log('BANKHOLIDAYINFO', bankHolidayInfo);
  const result: MetaResult = {
    type: 'BankHoliday',
    name,
    dates: bankHolidayInfo.results[0].data.map((record: any) => record.row[0]),
    regions: bankHolidayInfo.results[1].data.map((record: any) => record.row[0].name)
  }
  return result;
};


const sendCypherQuery = async function(cypherQuery: Neo4jQuery[], timeout: number) {
  console.log('sending', JSON.stringify(cypherQuery, null, 2));
  const { data } = await axios.post(
    neo4jParams.url,
    { statements: cypherQuery },
    { timeout, headers: { 'Content-Type': 'application/json' } }
  );
  return data;
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


export { sendCypherSearchQuery, sendCypherInitQuery, getTaxonInfo, getOrganisationInfo, getRoleInfo, getPersonInfo, getBankHolidayInfo };
