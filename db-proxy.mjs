import got from 'got';

const neo4jParams = {
  url: process.env.NEO4J_URL || "http://127.0.0.1:7474/db/neo4j/tx",
  password: process.env.NEO4J_PASSWORD || null,
  username: process.env.NEO4J_USERNAME || null
};

const postToNeo4j = async function(body) {
  const headers = { 'Content-Type': 'application/json' }
  if (neo4jParams.username || neo4jParams.password) {
    headers.Authorization =
      'Basic ' + Buffer.from(neo4jParams.username + ":" + neo4jParams.password, 'binary').toString('base64');
  }

  console.log('nok2', body)

  const data = await got.post(neo4jParams.url, {
    json: body,
    headers
  });

//  console.log(data)

//  console.log('nok22', data)

  return JSON.parse(data.body);
}

export { postToNeo4j };
