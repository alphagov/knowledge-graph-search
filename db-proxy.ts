import axios from 'axios';
import { SearchArea, Combinator, SearchType, SearchParams } from './src/ts/search-types';
import { mainCypherQuery } from './src/ts/neo4j';
import { Neo4jQuery } from './src/ts/neo4j-types';
import { makeQueryString, splitKeywords } from './src/ts/search-utils';


const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx",
  password: process.env.NEO4J_PASSWORD || null,
  username: process.env.NEO4J_USERNAME || null
};


// Send a Cypher query to the Neo4j server
const sendCypherSearchQuery = async function(searchParams: SearchParams) {
  console.log('sendCypherSearchQuery');
  // build the neo4j query from the search params extracted from the body
  console.log('MAINNEO4JQUERY', searchParams);
  const mainNeo4jQuery: string = mainCypherQuery(searchParams);

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
  return sendCypherQuery(wholeQuery, 60000);
}

const sendCypherInitQuery = async function() {
  const query: Neo4jQuery[] = [
    { statement: 'MATCH (t:Taxon) RETURN t.name' },
    { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
  ];
  return sendCypherQuery(query, 5000);
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
  return await sendCypherQuery(query, 5000);
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
  return await sendCypherQuery(query, 5000);
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
  return await sendCypherQuery(query, 5000);
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
  return await sendCypherQuery(query, 5000);
};


const getBankHolidayInfo = async function(name: string) {
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
  return await sendCypherQuery(query, 5000);
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


export { sendCypherSearchQuery, sendCypherInitQuery, getTaxonInfo, getOrganisationInfo, getRoleInfo, getPersonInfo, getBankHolidayInfo };
