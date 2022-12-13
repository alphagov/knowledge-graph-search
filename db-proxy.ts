import axios from 'axios';

const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx",
  password: process.env.NEO4J_PASSWORD || null,
  username: process.env.NEO4J_USERNAME || null
};

const postToNeo4j = async function(body: string) {
  const headers: any = { 'Content-Type': 'application/json' }
  if (neo4jParams.username || neo4jParams.password) {
    headers.Authorization =
      'Basic ' + Buffer.from(neo4jParams.username + ":" + neo4jParams.password, 'binary').toString('base64');
  }
  const { data } = await axios.post(
    neo4jParams.url,
    body,
    headers
  );
  return data;
}

export { postToNeo4j };
