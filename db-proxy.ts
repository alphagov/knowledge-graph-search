import axios from 'axios';
import { SearchArea, Combinator, SearchType, SearchParams } from './src/ts/search-types';
import { mainCypherQuery } from './src/ts/neo4j';
import { Neo4jQuery } from './src/ts/neo4j-types';


const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx",
  password: process.env.NEO4J_PASSWORD || null,
  username: process.env.NEO4J_USERNAME || null
};


const sendOldSkoolCypherQuery = async function(body: Neo4jQuery) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (neo4jParams.username || neo4jParams.password) {
    headers.Authorization =
      'Basic ' + Buffer.from(neo4jParams.username + ":" + neo4jParams.password, 'binary').toString('base64');
  }
  console.log('axios', body);
  const { data } = await axios({
    method: 'post',
    url: neo4jParams.url,
    data: body,
    headers
  });
  console.log('data')
  console.log(data);
  return data;
};

// Send a Cypher query to the Neo4j server
const sendCypherSearchQuery = async function(searchParams: SearchParams) {

  // curl -d '{"statements": [{"statement": "MATCH (t:Taxon) RETURN t.name"}]}' -H "Authorization: Basic XXXXXXXXXXXX==" -H "Content-Type: application/json"  https://knowledge-graph.integration.govuk.digital:7473/db/neo4j/tx | jq .


  // build the neo4j query from the search params extracted from the body
  const mainNeo4jQuery: string = mainCypherQuery(searchParams);

  const mainQuery: Neo4jQuery = {
    statement: mainCypherQuery(searchParams)
  };

  return sendCypherQuery([mainQuery], 60000);
}

const sendCypherInitQuery = async function() {
  const query: Neo4jQuery[] = [
    { statement: 'MATCH (t:Taxon) RETURN t.name' },
    { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
  ];
  console.log('sendCypherInitQuery');
  return await sendCypherQuery(query, 5000);
}


const sendCypherQuery = async function(cypherQuery: Neo4jQuery[], timeout: number) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (neo4jParams.username || neo4jParams.password) {
    headers.Authorization =
      'Basic ' + Buffer.from(neo4jParams.username + ":" + neo4jParams.password, 'binary').toString('base64');
  }
  // Send the cypher query
  console.log('sending the cypher query');
  const { data } = await axios.post(
    neo4jParams.url,
    { statements: cypherQuery },
    { timeout, headers }
  );
  console.log('axios!');
  console.log(data);
  return data;
};

export { sendCypherSearchQuery, sendCypherInitQuery, sendOldSkoolCypherQuery };
